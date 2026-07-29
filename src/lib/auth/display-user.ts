/**
 * مستخدم العرض للمرحلة الأولى فقط.
 *
 * موجود ليعرض الشريط العلوي اسمًا وصورة رمزية بدل فراغ.
 * ليس جلسة، ولا يمنح صلاحية، ولا يُقرأ من أي موضع يفرض حماية.
 * يُحذف بالكامل عند توصيل Auth.js في المرحلة الثانية.
 */
export const displayUser = {
  name: { ar: "عمر النعماني", en: "Omar Al-Namani" },
  initials: { ar: "ع", en: "O" },
  email: "omar@namani.sa",
  roleKey: "owner",
} as const;
