import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion from '@tiptap/suggestion'
import type { SuggestionOptions, SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'

/**
 * Emoji picker (acceptance §2, v1.1): typing `:` anywhere opens a picker
 * filtered by name/keywords; Return / click inserts the emoji and closes.
 * Runs on @tiptap/suggestion like the slash menu — IME composition guard
 * comes for free (suggestion ignores composing transactions).
 */

export interface EmojiItem {
  char: string
  name: string
  keywords: string[]
}

/** Curated common set; hosts may append via `extraItems`. */
export const EMOJI_ITEMS: EmojiItem[] = [
  { char: '😀', name: 'grinning', keywords: ['face', 'happy', 'smile'] },
  { char: '😄', name: 'smile', keywords: ['face', 'happy', 'joy'] },
  { char: '😁', name: 'beaming', keywords: ['face', 'grin'] },
  { char: '😂', name: 'joy', keywords: ['face', 'tears', 'lol'] },
  { char: '🤣', name: 'rofl', keywords: ['face', 'laugh', 'floor'] },
  { char: '😊', name: 'blush', keywords: ['face', 'happy', 'warm'] },
  { char: '🙂', name: 'slight_smile', keywords: ['face', 'smile'] },
  { char: '😉', name: 'wink', keywords: ['face'] },
  { char: '😍', name: 'heart_eyes', keywords: ['face', 'love'] },
  { char: '😘', name: 'kiss', keywords: ['face', 'love'] },
  { char: '😜', name: 'zany', keywords: ['face', 'crazy', 'tongue'] },
  { char: '🤔', name: 'thinking', keywords: ['face', 'hmm'] },
  { char: '🤗', name: 'hug', keywords: ['face'] },
  { char: '🤨', name: 'eyebrow', keywords: ['face', 'suspicious'] },
  { char: '😐', name: 'neutral', keywords: ['face', 'meh'] },
  { char: '😴', name: 'sleeping', keywords: ['face', 'zzz'] },
  { char: '😪', name: 'sleepy', keywords: ['face', 'tired'] },
  { char: '😫', name: 'tired', keywords: ['face', 'exhausted'] },
  { char: '🥳', name: 'partying', keywords: ['face', 'celebrate'] },
  { char: '😎', name: 'cool', keywords: ['face', 'sunglasses'] },
  { char: '🤓', name: 'nerd', keywords: ['face', 'glasses'] },
  { char: '😭', name: 'sob', keywords: ['face', 'cry', 'tears'] },
  { char: '😡', name: 'angry', keywords: ['face', 'rage'] },
  { char: '😱', name: 'scream', keywords: ['face', 'fear'] },
  { char: '🤯', name: 'exploding_head', keywords: ['face', 'mind', 'blown'] },
  { char: '🥺', name: 'pleading', keywords: ['face', 'puppy'] },
  { char: '😇', name: 'innocent', keywords: ['face', 'angel', 'halo'] },
  { char: '🤝', name: 'handshake', keywords: ['hands', 'deal'] },
  { char: '👍', name: 'thumbsup', keywords: ['hand', 'ok', 'like', 'yes'] },
  { char: '👎', name: 'thumbsdown', keywords: ['hand', 'dislike', 'no'] },
  { char: '👌', name: 'ok_hand', keywords: ['hand'] },
  { char: '✌️', name: 'victory', keywords: ['hand', 'peace'] },
  { char: '🤞', name: 'crossed_fingers', keywords: ['hand', 'luck'] },
  { char: '👏', name: 'clap', keywords: ['hands', 'praise'] },
  { char: '🙏', name: 'pray', keywords: ['hands', 'thanks'] },
  { char: '💪', name: 'muscle', keywords: ['arm', 'strong'] },
  { char: '❤️', name: 'heart', keywords: ['love', 'red'] },
  { char: '🧡', name: 'orange_heart', keywords: ['love'] },
  { char: '💛', name: 'yellow_heart', keywords: ['love'] },
  { char: '💚', name: 'green_heart', keywords: ['love'] },
  { char: '💙', name: 'blue_heart', keywords: ['love'] },
  { char: '💜', name: 'purple_heart', keywords: ['love'] },
  { char: '🖤', name: 'black_heart', keywords: ['love'] },
  { char: '💔', name: 'broken_heart', keywords: ['love', 'sad'] },
  { char: '⭐', name: 'star', keywords: ['favorite'] },
  { char: '🌟', name: 'glowing_star', keywords: ['star', 'shine'] },
  { char: '✨', name: 'sparkles', keywords: ['magic', 'shine', 'ai'] },
  { char: '🔥', name: 'fire', keywords: ['hot', 'flame'] },
  { char: '⚡', name: 'zap', keywords: ['lightning', 'fast'] },
  { char: '💡', name: 'bulb', keywords: ['idea', 'light'] },
  { char: '✅', name: 'check', keywords: ['done', 'ok', 'complete'] },
  { char: '❌', name: 'x', keywords: ['wrong', 'no', 'cancel'] },
  { char: '⚠️', name: 'warning', keywords: ['caution', 'alert'] },
  { char: '❓', name: 'question', keywords: ['ask', 'help'] },
  { char: '❗', name: 'exclamation', keywords: ['important'] },
  { char: '🚀', name: 'rocket', keywords: ['ship', 'launch', 'fast'] },
  { char: '🎉', name: 'tada', keywords: ['party', 'celebrate', 'congrats'] },
  { char: '🎊', name: 'confetti', keywords: ['party'] },
  { char: '🎯', name: 'dart', keywords: ['target', 'goal'] },
  { char: '📌', name: 'pushpin', keywords: ['pin'] },
  { char: '📎', name: 'paperclip', keywords: ['attach'] },
  { char: '📝', name: 'memo', keywords: ['note', 'doc', 'write'] },
  { char: '📅', name: 'calendar', keywords: ['date', 'schedule'] },
  { char: '⏰', name: 'alarm', keywords: ['clock', 'time'] },
  { char: '💰', name: 'moneybag', keywords: ['money', 'cash'] },
  { char: '🎁', name: 'gift', keywords: ['present'] },
  { char: '☕', name: 'coffee', keywords: ['drink', 'tea'] },
  { char: '🍕', name: 'pizza', keywords: ['food'] },
  { char: '🌈', name: 'rainbow', keywords: ['color'] },
  { char: '☀️', name: 'sunny', keywords: ['weather', 'sun'] },
  { char: '🌙', name: 'crescent', keywords: ['weather', 'moon', 'night'] },
  { char: '☁️', name: 'cloud', keywords: ['weather'] },
  { char: '👀', name: 'eyes', keywords: ['look', 'watch'] },
  { char: '🤖', name: 'robot', keywords: ['ai', 'bot'] },
  { char: '🐞', name: 'bug', keywords: ['insect', 'error'] },
]

export function filterEmojiItems(query: string, items: EmojiItem[] = EMOJI_ITEMS): EmojiItem[] {
  const q = query.toLowerCase()
  if (!q) {
    return items
  }
  return items.filter(
    item => item.name.toLowerCase().includes(q) || item.keywords.some(k => k.toLowerCase().includes(q)),
  )
}

export interface EmojiMenuOptions {
  /** UI renderer provided by a binding (same contract as the slash menu). */
  render?: () => {
    onStart: (props: SuggestionProps<EmojiItem>) => void
    onUpdate: (props: SuggestionProps<EmojiItem>) => void
    onExit: (props: SuggestionProps<EmojiItem>) => void
    onKeyDown?: (props: SuggestionKeyDownProps) => boolean
  }
  /** Hosts may append their own emoji entries. */
  extraItems?: () => EmojiItem[]
}

export const EmojiMenu = Extension.create<EmojiMenuOptions>({
  name: 'tesseraEmojiMenu',

  addOptions() {
    return {
      render: undefined,
      extraItems: undefined,
    }
  },

  addProseMirrorPlugins() {
    const options = this.options
    const items = [...EMOJI_ITEMS, ...(options.extraItems?.() ?? [])]

    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey('tesseraEmojiMenu'),
        char: ':',
        startOfLine: false,
        items: ({ query }) => filterEmojiItems(query, items),
        command: ({ editor: e, range, props }) => {
          e.chain().focus().insertContentAt(range, `${(props as EmojiItem).char} `).run()
        },
        render: options.render as SuggestionOptions<EmojiItem>['render'],
      }),
    ]
  },
})
