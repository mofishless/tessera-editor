/**
 * Word paste cleaning (acceptance §9, v1.1).
 *
 * Word export HTML is full of Office plumbing that ProseMirror's default
 * schema-based cleaning handles badly (mso styles leak as text, namespace
 * tags become unknown nodes, empty paragraphs multiply). When pasted HTML
 * is detected as Word source, these rules run BEFORE PM parses it:
 *
 *  R1  drop comments incl. `<!--[if ...]>...<![endif]-->` conditionals
 *  R2  drop <style>/<script>/<meta>/<link> blocks and tags
 *  R3  strip Office namespace tags entirely (<o:p>, <w:*, <st1:*>, <v:*>)
 *  R4  drop class / style / lang attributes (visual plumbing; bold/italic/
 *      underline survive via <b>/<i>/<u> tags which PM keeps)
 *  R5  drop Word list markers ("l" bullets in mso-list spans are removed
 *      with R3/R4; list paragraphs become plain paragraphs — semantic list
 *      reconstruction is explicitly out of scope for v1.1)
 *  R6  &nbsp; collapses to a normal space
 *  R7  empty paragraphs (<p></p>, <p><br></p>, whitespace-only) are removed
 */

export function isWordHtml(html: string): boolean {
  return (
    html.includes('urn:schemas-microsoft-com:office:word') ||
    html.includes('urn:schemas-microsoft-com:office:office') ||
    /mso-[\w-]+/.test(html) ||
    /\bMso\w+/.test(html) ||
    /<w:/i.test(html) ||
    /<o:/i.test(html)
  )
}

export function cleanWordHtml(html: string): string {
  let out = html
  // R1 comments + conditionals
  out = out.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
  out = out.replace(/<!--[\s\S]*?-->/g, '')
  // R2 style/script blocks, meta/link tags, xml prolog
  out = out.replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, '')
  out = out.replace(/<(meta|link)\b[^>]*>/gi, '')
  out = out.replace(/<\?xml[^>]*\?>/gi, '')
  out = out.replace(/<!DOCTYPE[^>]*>/gi, '')
  // R3 office namespace tags
  out = out.replace(/<\/?[a-z][a-z0-9]*:[^>]*>/gi, '')
  // R4 visual-plumbing attributes (double- and single-quoted)
  out = out.replace(/\s(class|style|lang|xml:lang|face)\s*=\s*"[^"]*"/gi, '')
  out = out.replace(/\s(class|style|lang|xml:lang|face)\s*=\s*'[^']*'/gi, '')
  // R6 non-breaking spaces
  out = out.replace(/&nbsp;/gi, ' ')
  // R7 empty paragraphs (iterate: nested whitespace collapses progressively)
  let prev = ''
  while (out !== prev) {
    prev = out
    out = out.replace(/<p\b[^>]*>(\s|<br\s*\/?>)*<\/p>/gi, '')
  }
  return out.trim()
}
