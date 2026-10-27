/**
 * All user-facing zakat text (Arabic + English). Kept next to the logic so a ruling
 * and the sentence that explains it are changed together.
 */
import type { DueKey } from "./livestock";

const ar = {
  tabs: { money: "زكاة المال", crops: "الزروع والثمار", livestock: "الأنعام", rikaz: "الركاز", fitr: "زكاة الفطر" },
  currency: "جنيه",
  kg: "كجم",
  disclaimer:
    "هذه الحاسبة أداة مساعدة مبنية على أقوال الفقهاء وما استقرت عليه فتاوى دار الإفتاء المصرية، وليست بديلًا عن سؤال أهل العلم في الحالات الخاصة أو المعقدة.",
  results: "النتيجة",
  due: "الزكاة الواجبة",
  money: {
    title: "زكاة المال والذهب والتجارة",
    intro: "الزكاة 2.5% من صافي المال إذا بلغ النصاب ومرّ عليه عام هجري كامل وكان زائدًا عن الحوائج الأصلية.",
    goldPrice: "سعر جرام الذهب عيار 21 اليوم (جنيه)",
    goldPriceHelp: "اكتب سعر اليوم بدون مصنعية. النصاب = قيمة 85 جرام ذهب عيار 21 بهذا السعر.",
    nisab: "النصاب الحالي",
    cash: "النقود والأرصدة والمدّخرات والودائع",
    cashHelp: "ويدخل فيها ما ادّخرته من الراتب أو الإيجار.",
    trade: "عروض التجارة (بضاعة للبيع بسعر السوق)",
    investments: "أسهم وصناديق مقتناة للمتاجرة (بقيمتها السوقية)",
    debtsOwed: "ديون لك عند الغير مرجوّة السداد",
    goldSection: "الذهب (بالجرام)",
    goldSaved: "للادّخار أو الاستثمار",
    goldSavedHelp: "سبائك وجنيهات وحُلي غير مستعملة.",
    goldWorn: "حُلي للزينة",
    goldWornHelp: "لا زكاة فيه عند الجمهور وهو المختار للفتوى في دار الإفتاء، إذا كان للزينة المعتادة دون إسراف.",
    karat: "عيار",
    includeWorn: "احسب حُلي الزينة أيضًا (رأي الحنفية)",
    silver: "الفضة (جرام)",
    silverPrice: "سعر جرام الفضة اليوم (جنيه)",
    dueDebts: "ديون عليك مستحقة السداد (تُخصم)",
    hawl: "مرّ عام هجري كامل وأنا أملك النصاب أو أكثر",
    totalAssets: "إجمالي الأموال",
    dueDebtsRow: "ديون تُخصم",
    net: "الصافي",
    status: {
      need_price: "أدخل سعر جرام الذهب عيار 21 ليُحسب النصاب.",
      need_silver_price: "أدخل سعر جرام الفضة.",
      hawl_pending: "بلغ مالك النصاب لكن لم يمرّ عليه عام هجري كامل، فلا زكاة الآن. تُخرج الزكاة عند تمام الحول.",
      below_nisab: "صافي مالك أقل من النصاب، فلا زكاة عليك الآن.",
    },
  },
  crops: {
    title: "زكاة الزروع والثمار",
    intro: "تجب عند الحصاد، ولا يُشترط لها مرور عام.",
    yield: "وزن المحصول (كجم)",
    irrigation: "طريقة الري",
    rain: "مطر أو ري طبيعي بلا تكلفة (العُشر 10%)",
    machine: "ري بآلة أو بتكلفة (نصف العُشر 5%)",
    mixed: "الاثنان بالتساوي (7.5%)",
    school: "الرأي الفقهي",
    hanafi: "الحنفي (تأخذ به دار الإفتاء المصرية في الزروع): تجب في كل ما تُخرجه الأرض ولو قلّ، بلا نصاب.",
    jumhur: "الجمهور (المالكية والشافعية والحنابلة): يُشترط النصاب 653 كجم، ويخص الحبوب والثمار التي تُدّخر.",
    price: "سعر الكيلو (اختياري، لمعرفة القيمة نقدًا)",
    note: "لا تُخصم تكاليف الزراعة من المحصول في هذا الحساب.",
    zakatKg: "الواجب من المحصول",
    zakatCash: "قيمته نقدًا",
    rate: "النسبة",
    status: {
      need_yield: "أدخل وزن المحصول.",
      below_nisab: "محصولك أقل من النصاب (653 كجم) عند الجمهور، فلا زكاة فيه.",
    },
  },
  livestock: {
    title: "زكاة الأنعام",
    intro: "تجب في الإبل والبقر (ومنها الجاموس) والغنم (ومنها الماعز) إذا بلغت النصاب ومرّ عليها عام هجري.",
    kindLegend: "نوع الأنعام",
    kind: { camel: "الإبل", cattle: "البقر والجاموس", sheep: "الغنم والماعز" },
    count: "عدد الحيوانات",
    grazing: "سائمة: ترعى من المراعي أغلب العام",
    grazingHelp: "المعلوفة (التي تُطعمها بنفسك) لا زكاة أنعام فيها. وإن كانت للتجارة فاحسبها ضمن عروض التجارة.",
    result: "الواجب إخراجه",
    or: "أو، يختار المُزكّي:",
    names: {
      sheep: "شاة",
      bintMakhad: "بنت مخاض (عمرها سنة)",
      bintLabun: "بنت لبون (عمرها سنتان)",
      hiqqa: "حِقّة (عمرها ثلاث سنوات)",
      jadha: "جذعة (عمرها أربع سنوات)",
      tabi: "تبيع (عمره سنة)",
      musinna: "مسنّة (عمرها سنتان)",
    } satisfies Record<DueKey, string>,
    status: {
      need_count: "أدخل عدد الحيوانات.",
      not_grazing: "لا زكاة أنعام في المعلوفة. إن كانت للتجارة فاحسبها في «زكاة المال».",
      below_nisab: "العدد أقل من النصاب، فلا زكاة فيه.",
    },
  },
  rikaz: {
    title: "زكاة الركاز",
    intro: "الركاز كنز مدفون من زمن قديم يُعثر عليه. فيه الخُمس (20%) فور الحصول عليه، بلا نصاب ولا حول.",
    value: "قيمة الركاز (جنيه)",
    result: "الواجب (الخُمس)",
    note: "اختلف الفقهاء في المعادن المستخرجة (كالذهب والبترول)، ولذلك لا تشملها هذه الحاسبة. اسأل أهل العلم عنها.",
  },
  fitr: {
    title: "زكاة الفطر",
    intro: "تجب على كل مسلم عن نفسه وعمّن يعوله، وتُخرج قبل صلاة عيد الفطر. وتعلن دار الإفتاء قيمتها كل عام.",
    persons: "عدد الأفراد",
    amount: "قيمة زكاة الفطر للفرد (جنيه) كما أعلنتها دار الإفتاء",
    total: "الإجمالي",
  },
};

export type ZakatCopy = typeof ar;

const en: ZakatCopy = {
  tabs: { money: "Wealth", crops: "Crops & fruit", livestock: "Livestock", rikaz: "Rikaz", fitr: "Zakat al-Fitr" },
  currency: "EGP",
  kg: "kg",
  disclaimer:
    "This calculator is a helper based on the views of the jurists and the fatwas of Egypt's Dar al-Ifta. It does not replace asking a qualified scholar about special or complex cases.",
  results: "Result",
  due: "Zakat due",
  money: {
    title: "Zakat on wealth, gold and trade",
    intro:
      "Zakat is 2.5% of your net wealth if it reaches the nisab, a full lunar year has passed, and it is surplus to your basic needs.",
    goldPrice: "Today's price per gram of 21K gold (EGP)",
    goldPriceHelp: "Enter today's price without making charges. Nisab = the value of 85 g of 21K gold at this price.",
    nisab: "Current nisab",
    cash: "Cash, bank balances, savings and deposits",
    cashHelp: "Includes saved salary or rental income.",
    trade: "Trade goods (stock for sale, at market price)",
    investments: "Shares and funds held for trading (market value)",
    debtsOwed: "Debts owed to you that you can collect",
    goldSection: "Gold (grams)",
    goldSaved: "Savings or investment",
    goldSavedHelp: "Bars, coins and jewellery not in use.",
    goldWorn: "Worn as adornment",
    goldWornHelp:
      "Not zakatable under the majority view, which is the one Dar al-Ifta favours, when worn as ordinary adornment without extravagance.",
    karat: "Karat",
    includeWorn: "Also count worn jewellery (Hanafi view)",
    silver: "Silver (grams)",
    silverPrice: "Today's price per gram of silver (EGP)",
    dueDebts: "Debts you owe that are due (deducted)",
    hawl: "A full lunar year has passed and I held the nisab or more",
    totalAssets: "Total assets",
    dueDebtsRow: "Debts deducted",
    net: "Net wealth",
    status: {
      need_price: "Enter the 21K gold price per gram to compute the nisab.",
      need_silver_price: "Enter the price per gram of silver.",
      hawl_pending:
        "Your wealth reached the nisab but a full lunar year has not passed, so no zakat is due yet. Pay it when the year is complete.",
      below_nisab: "Your net wealth is below the nisab, so no zakat is due now.",
    },
  },
  crops: {
    title: "Zakat on crops and fruit",
    intro: "Due at harvest; no waiting year is required.",
    yield: "Harvest weight (kg)",
    irrigation: "Irrigation",
    rain: "Rain or natural water, no cost (one tenth, 10%)",
    machine: "Machine-pumped or paid-for water (one twentieth, 5%)",
    mixed: "Both in equal measure (7.5%)",
    school: "Juristic view",
    hanafi: "Hanafi (followed by Egypt's Dar al-Ifta for crops): due on anything the land yields, however small, with no nisab.",
    jumhur: "Majority (Maliki, Shafi'i, Hanbali): a nisab of 653 kg applies, for storable grains and fruit.",
    price: "Price per kg (optional, to see the cash value)",
    note: "Farming costs are not deducted from the harvest in this calculation.",
    zakatKg: "Due from the harvest",
    zakatCash: "Cash equivalent",
    rate: "Rate",
    status: {
      need_yield: "Enter the harvest weight.",
      below_nisab: "Your harvest is below the nisab (653 kg) under the majority view, so no zakat is due.",
    },
  },
  livestock: {
    title: "Zakat on livestock",
    intro: "Due on camels, cattle (including buffalo) and sheep or goats once they reach the nisab and a lunar year passes.",
    kindLegend: "Type of livestock",
    kind: { camel: "Camels", cattle: "Cattle & buffalo", sheep: "Sheep & goats" },
    count: "Number of animals",
    grazing: "Free-grazing for most of the year (sa'ima)",
    grazingHelp:
      "Animals you feed yourself carry no livestock zakat. If they are for trade, count them under Wealth as trade goods.",
    result: "What is due",
    or: "Or, at the payer's choice:",
    names: {
      sheep: "sheep",
      bintMakhad: "bint makhad (1 year old camel)",
      bintLabun: "bint labun (2 year old camel)",
      hiqqa: "hiqqa (3 year old camel)",
      jadha: "jadha (4 year old camel)",
      tabi: "tabi' (1 year old cow/buffalo)",
      musinna: "musinna (2 year old cow/buffalo)",
    },
    status: {
      need_count: "Enter the number of animals.",
      not_grazing: "No livestock zakat on fed animals. If they are for trade, use the Wealth tab.",
      below_nisab: "The number is below the nisab, so no zakat is due.",
    },
  },
  rikaz: {
    title: "Zakat on rikaz",
    intro: "Rikaz is buried treasure from ancient times that you find. One fifth (20%) is due immediately, with no nisab or waiting year.",
    value: "Value of the find (EGP)",
    result: "Due (one fifth)",
    note: "Jurists differ on mined minerals (such as gold or oil), so this calculator does not cover them. Ask a scholar.",
  },
  fitr: {
    title: "Zakat al-Fitr",
    intro:
      "Due on every Muslim for themselves and their dependants, paid before the Eid al-Fitr prayer. Dar al-Ifta announces the amount each year.",
    persons: "Number of people",
    amount: "Zakat al-Fitr per person (EGP) as announced by Dar al-Ifta",
    total: "Total",
  },
};

export const ZAKAT_COPY: Record<"ar" | "en", ZakatCopy> = { ar, en };

export function getZakatCopy(locale: string): ZakatCopy {
  return locale === "ar" ? ar : en;
}

export function formatNumber(n: number, locale: string, maxFraction = 2): string {
  return new Intl.NumberFormat(`${locale === "ar" ? "ar-EG" : "en"}-u-nu-latn`, {
    maximumFractionDigits: maxFraction,
  }).format(n);
}
