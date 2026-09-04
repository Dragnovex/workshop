/**
 * ترميز TLV/Base64 للحقول الدنيا المطلوبة في رمز الاستجابة السريعة (QR)
 * للفواتير المبسّطة — المرحلة الأولى من فاتورة (بلا اتصال أو توقيع رقمي).
 *
 * الحقول الخمسة الإلزامية دنيًا: اسم البائع، الرقم الضريبي، الطابع الزمني،
 * إجمالي الفاتورة شامل الضريبة، إجمالي الضريبة.
 *
 * هذا ترميز البيانات فقط — لا يُنتج صورة QR مرئية (لا توجد مكتبة توليد
 * صور QR مثبّتة في المشروع). يُعرض الحمل (payload) نصيًا في الواجهة
 * والطباعة إلى حين اعتماد مكتبة رسم QR أو تكامل خارجي.
 */

function tlvField(tag: number, value: string): Uint8Array {
  const valueBytes = new TextEncoder().encode(value);
  if (valueBytes.length > 255) {
    throw new Error(`ZATCA QR field ${tag} exceeds 255 bytes`);
  }
  const field = new Uint8Array(2 + valueBytes.length);
  field[0] = tag;
  field[1] = valueBytes.length;
  field.set(valueBytes, 2);
  return field;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export type ZatcaSimplifiedQrInput = {
  sellerName: string;
  vatNumber: string;
  /** الطابع الزمني بصيغة ISO 8601 لوقت إصدار الفاتورة. */
  timestampIso: string;
  /** إجمالي الفاتورة شامل الضريبة. */
  invoiceTotal: number;
  vatTotal: number;
};

/** يُنتج Base64 لحمل TLV — الحقول الخمسة الدنيا فقط (بلا توقيع/هاش المرحلة الثانية). */
export function generateZatcaSimplifiedQrPayload(input: ZatcaSimplifiedQrInput): string {
  const fields = [
    tlvField(1, input.sellerName),
    tlvField(2, input.vatNumber),
    tlvField(3, input.timestampIso),
    tlvField(4, input.invoiceTotal.toFixed(2)),
    tlvField(5, input.vatTotal.toFixed(2)),
  ];
  const totalLength = fields.reduce((sum, field) => sum + field.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const field of fields) {
    combined.set(field, offset);
    offset += field.length;
  }
  return bytesToBase64(combined);
}
