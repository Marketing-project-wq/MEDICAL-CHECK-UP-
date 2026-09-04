// Overlay an mcu-original article's English fields when rendering the EN site.
//
// mcu-original articles carry an `en` object ({ title, excerpt,
// meta_description, body_html }) with the English translation; the base fields
// stay Indonesian. For the EN site we overlay `en` onto the base (slug,
// category, dates, published_url and the derived cover/topic stay shared).
// media_articles have no `en` and pass through unchanged.
export function localizeArticle(a, lang) {
  if (!a || lang !== "en" || !a.en) return a;
  const { en, ...base } = a;
  return { ...base, ...en };
}
