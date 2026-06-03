/**
 * Renders one JSON-LD block. Native <script> (not next/script) is correct for
 * structured data — it's data, not executable code, and must be in the initial
 * HTML. The `<` → `<` escape blocks any `</script>` injection.
 */
export const JsonLd = ({ data }: { data: object }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
  />
);
