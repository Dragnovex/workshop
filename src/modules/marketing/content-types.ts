import type { LocalizedText } from "@/lib/domain/contracts";

/**
 * استوديو المحتوى التسويقي.
 *
 * ثلاث خانات ثابتة (بوستات/صور) عمدًا لا قائمة مفتوحة: الورشة تنشر
 * دفعة أسبوعية قصيرة، والقائمة المفتوحة تتحوّل إلى مقبرة مسودات.
 */
export const contentSlotCount = 3;

export const contentSlotStatuses = ["idea", "ready", "published"] as const;
export type ContentSlotStatus = (typeof contentSlotStatuses)[number];

export type ContentSlot = {
  id: string;
  /** ترتيب الخانة (١..٣) — يحدّد موضعها في الشبكة. */
  position: number;
  title: string;
  /** نص المنشور كما سيُنشر. */
  body: string;
  /** رابط الصورة أو الفيديو — يُعرض كرابط لا كصورة مضمّنة (لا رفع ملفات بعد). */
  mediaUrl?: string;
  status: ContentSlotStatus;
  updatedAt: string;
};

/** تعليمة أو هوك جاهز يُنسخ إلى المنشور. */
export type ContentHook = {
  id: string;
  category: "hook" | "instruction";
  text: LocalizedText;
};

/**
 * هوكات وتعليمات جاهزة — محتوى ثابت في الكود لا بيانات مستخدم.
 * موجودة لأن الموظف الذي يكتب المنشور ليس كاتب إعلانات، والصفحة
 * الفارغة أصعب عليه من التعديل على جملة جاهزة.
 */
export const contentHooks: ContentHook[] = [
  {
    id: "hook-1",
    category: "hook",
    text: {
      ar: "صوت غريب من الفرامل؟ لا تأجّل — الفحص عندنا مجاني.",
      en: "Strange noise from the brakes? Do not postpone — inspection is free here.",
    },
  },
  {
    id: "hook-2",
    category: "hook",
    text: {
      ar: "٣ علامات تقول إن زيت محركك انتهى قبل موعده.",
      en: "Three signs your engine oil is finished before its due date.",
    },
  },
  {
    id: "hook-3",
    category: "hook",
    text: {
      ar: "سيارتك تسحب لجهة واحدة؟ غالبًا ليست الإطارات.",
      en: "Car pulling to one side? It is usually not the tyres.",
    },
  },
  {
    id: "hook-4",
    category: "hook",
    text: {
      ar: "قبل سفر الإجازة: فحص كامل في ٣٠ دقيقة.",
      en: "Before the holiday drive: a full check in 30 minutes.",
    },
  },
  {
    id: "hook-5",
    category: "hook",
    text: {
      ar: "قطع أصلية بضمان — والفاتورة ضريبية موثّقة.",
      en: "Genuine parts with warranty — and a documented tax invoice.",
    },
  },
  {
    id: "instruction-1",
    category: "instruction",
    text: {
      ar: "ابدأ بالمشكلة التي يعرفها العميل، لا بالخدمة التي تبيعها.",
      en: "Start with the problem the customer knows, not the service you sell.",
    },
  },
  {
    id: "instruction-2",
    category: "instruction",
    text: {
      ar: "صورة واحدة واضحة للسيارة أو القطعة أفضل من ثلاث صور مزدحمة.",
      en: "One clear photo of the car or part beats three crowded ones.",
    },
  },
  {
    id: "instruction-3",
    category: "instruction",
    text: {
      ar: "اذكر السعر أو المدة صراحةً — الغموض يقتل التفاعل.",
      en: "State the price or the duration explicitly — vagueness kills engagement.",
    },
  },
  {
    id: "instruction-4",
    category: "instruction",
    text: {
      ar: "اختم بدعوة واحدة فقط: اتصل، أو احجز، أو مرّ علينا.",
      en: "Close with one call to action only: call, book, or drop by.",
    },
  },
  {
    id: "instruction-5",
    category: "instruction",
    text: {
      ar: "لا تعد بما لا تضمنه الورشة — الوعد المكسور يعود شكوى.",
      en: "Never promise what the workshop cannot guarantee — a broken promise returns as a complaint.",
    },
  },
];
