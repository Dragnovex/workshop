import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * تخزين محلي دائم لوضع البذرة — طبقة فوق ملفات JSON في `.data/`.
 *
 * **لماذا ملف لا ذاكرة؟** الذاكرة تُفقد عند كل إعادة تشغيل للخادم (وNext
 * يعيد التشغيل عند كل تعديل في التطوير)، فيختفي ما أدخله المستخدم قبل
 * دقيقة. وهذا بالضبط ما كان سيجعل الانتقال من `localStorage` إلى الخادم
 * **تراجعًا** لا تقدّمًا.
 *
 * **ماذا يحلّ؟** البيانات تصير على الخادم لا في متصفح واحد: كل الأجهزة
 * على نفس الشبكة ترى نفس السجلات، وهو الفرق العملي الذي يجعل النظام
 * قابلًا للاستخدام بين موظفَين.
 *
 * ⚠️ **ليس قاعدة بيانات ولا بديلًا عنها.** لا معاملات (transactions)، ولا
 * فهارس، ولا تحكّم بالتزامن سوى قفل الكتابة الترتيبي أدناه، ولا يعمل على
 * استضافة بلا نظام ملفات قابل للكتابة (serverless). هو جسر التطوير حتى
 * وصول Supabase، ومن أجل ذلك عقده مطابق تمامًا لعقد محوّل Supabase.
 */

const DATA_DIR = join(process.cwd(), ".data");

function filePathFor(name: string): string {
  return join(DATA_DIR, `${name}.json`);
}

/**
 * كتابة متسلسلة لكل ملف على حدة.
 *
 * طلبان متزامنان يعدّلان نفس المجموعة كانا سيقرآن الحالة نفسها ثم يكتب
 * الثاني فوق الأول فيضيع تعديله بصمت — نفس صنف الخطأ الذي أفسد استلام
 * المشتريات على العميل. السلسلة تضمن أن كل عملية تقرأ ما كتبته سابقتها.
 */
const writeChains = new Map<string, Promise<unknown>>();

function serialize<T>(name: string, operation: () => T): Promise<T> {
  const previous = writeChains.get(name) ?? Promise.resolve();
  const next = previous.then(operation, operation);
  // سلسلة لا تنكسر بفشل عملية: خطأ واحد يجب ألا يقفل المجموعة للأبد.
  writeChains.set(
    name,
    next.catch(() => undefined),
  );
  return next;
}

function readFile<T>(name: string): T[] | null {
  const path = filePathFor(name);
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as T[];
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    // ملف تالف: نفشل بصوت عالٍ بدل العودة الصامتة للبذرة — العودة الصامتة
    // تعني أن المستخدم يرى بياناته وقد اختفت ويظنها لم تُحفظ أصلًا.
    throw new Error(
      `ملف البيانات المحلي ${path} تالف أو غير قابل للقراءة: ${String(error)}`,
    );
  }
}

function writeFile<T>(name: string, rows: T[]): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(filePathFor(name), JSON.stringify(rows, null, 2), "utf8");
}

/**
 * مجموعة مخزَّنة في ملف، تبدأ من البذرة عند أول تشغيل.
 *
 * البذرة تُكتب إلى الملف عند أول قراءة لا تُدمج في كل مرة: بعد أن يملك
 * المستخدم بياناته، إعادة حقن البذرة تعني إحياء سجلات حذفها.
 */
export function loadCollection<T>(name: string, seed: readonly T[]): T[] {
  const stored = readFile<T>(name);
  if (stored !== null) return stored;
  const initial = [...seed];
  writeFile(name, initial);
  return initial;
}

export function saveCollection<T>(name: string, rows: T[]): Promise<void> {
  return serialize(name, () => writeFile(name, rows));
}

/** قراءة‑تعديل‑كتابة ذرّية بالنسبة لبقية عمليات نفس المجموعة. */
export function mutateCollection<T, R>(
  name: string,
  seed: readonly T[],
  mutator: (rows: T[]) => { rows: T[]; result: R },
): Promise<R> {
  return serialize(name, () => {
    const current = loadCollection(name, seed);
    const { rows, result } = mutator(current);
    writeFile(name, rows);
    return result;
  });
}
