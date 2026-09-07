// jsdom implements no layout, so it lacks Element.scrollIntoView entirely —
// any component whose effects call it would crash under test. Components
// under test here (slash/emoji menus) call it to follow keyboard highlight.
Element.prototype.scrollIntoView = () => {}
