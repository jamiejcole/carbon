/*
  AVR Assembly Code Mirror Mode (avrasm2 / avr-gcc syntax)
*/

const CodeMirror = require('codemirror')

CodeMirror.defineMode('avr', function () {
  const register = /^(?:r(?:[12]?\d|3[01])|[XYZ][+]?|[XYZ][HL])$/i

  function string(quote) {
    return function (stream, state) {
      let escaped = false
      let ch
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) break
        escaped = !escaped && ch == '\\'
      }
      if (!escaped) state.cur = null
      return 'string'
    }
  }

  return {
    startState: function () {
      return { cur: null, sawOp: false }
    },

    token: function (stream, state) {
      if (stream.sol()) state.sawOp = false
      if (state.cur) return state.cur(stream, state)
      if (stream.eatSpace()) return null

      if (stream.match(';') || stream.match('//')) {
        stream.skipToEnd()
        return 'comment'
      }

      const ch = stream.peek()

      if (ch == '"' || ch == "'") {
        stream.next()
        state.cur = string(ch)
        return state.cur(stream, state)
      }

      if (stream.match(/^(?:0x[\da-f]+|\$[\da-f]+|0b[01]+|\d+)\b/i)) return 'number'

      // Directives (.equ, .def, .org) and preprocessor (#include)
      if (stream.match(/^[.#]\w+/)) {
        state.sawOp = true
        return 'meta'
      }

      if (stream.match(/^\w+/)) {
        if (stream.eat(':')) return 'tag'
        if (!state.sawOp) {
          state.sawOp = true
          return 'keyword'
        }
        stream.eat('+')
        if (register.test(stream.current())) return 'variable-2'
        return 'variable'
      }

      // Pre-decrement, e.g. LD r16, -Z
      if (stream.match(/^-[XYZ]\b/)) return 'variable-2'

      stream.next()
      return null
    },

    lineComment: ';',
  }
})

CodeMirror.defineMIME('text/x-avr', 'avr')
