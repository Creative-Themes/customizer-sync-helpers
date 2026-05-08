/**
 * Lightweight CSS parser & stringifier.
 *
 * Inlined from shady-css-parser (Polymer Project, BSD license) — only the
 * modules actually used by this package (Parser, Stringifier and their
 * dependencies). The original ast-iterator module (which pulled in Node's
 * `util`) is intentionally excluded.
 */

// --- common ---

const matcher = {
  whitespace: /\s/,
  whitespaceGreedy: /(\s+)/g,
  commentGreedy: /(\*\/)/g,
  boundary: /[\(\)\{\}'"@;:\s]/,
  stringBoundary: /['"]/,
}

const nodeType = {
  stylesheet: 'stylesheet',
  comment: 'comment',
  atRule: 'atRule',
  ruleset: 'ruleset',
  expression: 'expression',
  declaration: 'declaration',
  rulelist: 'rulelist',
  discarded: 'discarded',
}

// --- token ---

const TokenType = {}
TokenType[TokenType['none'] = 0] = 'none'
TokenType[TokenType['whitespace'] = Math.pow(2, 0)] = 'whitespace'
TokenType[TokenType['string'] = Math.pow(2, 1)] = 'string'
TokenType[TokenType['comment'] = Math.pow(2, 2)] = 'comment'
TokenType[TokenType['word'] = Math.pow(2, 3)] = 'word'
TokenType[TokenType['boundary'] = Math.pow(2, 4)] = 'boundary'
TokenType[TokenType['propertyBoundary'] = Math.pow(2, 5)] = 'propertyBoundary'
TokenType[
  TokenType['openParenthesis'] = Math.pow(2, 6) | TokenType.boundary
] = 'openParenthesis'
TokenType[
  TokenType['closeParenthesis'] = Math.pow(2, 7) | TokenType.boundary
] = 'closeParenthesis'
TokenType[TokenType['at'] = Math.pow(2, 8) | TokenType.boundary] = 'at'
TokenType[TokenType['openBrace'] = Math.pow(2, 9) | TokenType.boundary] =
  'openBrace'
TokenType[
  TokenType['closeBrace'] =
    Math.pow(2, 10) | TokenType.propertyBoundary | TokenType.boundary
] = 'closeBrace'
TokenType[
  TokenType['semicolon'] =
    Math.pow(2, 11) | TokenType.propertyBoundary | TokenType.boundary
] = 'semicolon'
TokenType[
  TokenType['colon'] = Math.pow(2, 12) | TokenType.boundary | TokenType.word
] = 'colon'
TokenType[TokenType['hyphen'] = Math.pow(2, 13)] = 'hyphen'
TokenType[TokenType['underscore'] = Math.pow(2, 14)] = 'underscore'

class Token {
  constructor(type, start, end) {
    this.type = type
    this.start = start
    this.end = end
    this.previous = null
    this.next = null
  }
  is(type) {
    return (this.type & type) === type
  }
}
Token.type = TokenType

const boundaryTokenTypes = {
  '(': Token.type.openParenthesis,
  ')': Token.type.closeParenthesis,
  ':': Token.type.colon,
  '@': Token.type.at,
  '{': Token.type.openBrace,
  '}': Token.type.closeBrace,
  ';': Token.type.semicolon,
  '-': Token.type.hyphen,
  _: Token.type.underscore,
}

// --- tokenizer ---

class Tokenizer {
  constructor(cssText) {
    this.cursorToken_ = new Token(Token.type.none, 0, 0)
    this.currentToken_ = null
    this.cssText = cssText
  }
  get offset() {
    return this.cursorToken_.end
  }
  get currentToken() {
    if (this.currentToken_ == null) {
      this.currentToken_ = this.getNextToken_()
    }
    return this.currentToken_
  }
  advance() {
    let token
    if (this.currentToken_ != null) {
      token = this.currentToken_
      this.currentToken_ = null
    } else {
      token = this.getNextToken_()
    }
    return token
  }
  slice(startToken, endToken = undefined) {
    const { start, end } = this.getRange(startToken, endToken)
    return this.cssText.substring(start, end)
  }
  getRange(startToken, endToken = undefined) {
    return { start: startToken.start, end: (endToken || startToken).end }
  }
  trimRange({ start, end }) {
    while (start <= end && /\s/.test(this.cssText.charAt(start))) {
      start++
    }
    while (start <= end && end > 0 && /\s/.test(this.cssText.charAt(end - 1))) {
      end--
    }
    return { start, end }
  }
  flush() {
    const tokens = []
    while (this.currentToken) {
      tokens.push(this.advance())
    }
    return tokens
  }
  getNextToken_() {
    const character = this.cssText[this.offset]
    let token
    this.currentToken_ = null
    if (this.offset >= this.cssText.length) {
      return null
    } else if (matcher.whitespace.test(character)) {
      token = this.tokenizeWhitespace(this.offset)
    } else if (matcher.stringBoundary.test(character)) {
      token = this.tokenizeString(this.offset)
    } else if (
      character === '/' &&
      this.cssText[this.offset + 1] === '*'
    ) {
      token = this.tokenizeComment(this.offset)
    } else if (matcher.boundary.test(character)) {
      token = this.tokenizeBoundary(this.offset)
    } else {
      token = this.tokenizeWord(this.offset)
    }
    token.previous = this.cursorToken_
    this.cursorToken_.next = token
    this.cursorToken_ = token
    return token
  }
  tokenizeString(offset) {
    const quotation = this.cssText[offset]
    let escaped = false
    const start = offset
    let character
    while ((character = this.cssText[++offset])) {
      if (escaped) {
        escaped = false
        continue
      }
      if (character === quotation) {
        ++offset
        break
      }
      if (character === '\\') {
        escaped = true
      }
    }
    return new Token(Token.type.string, start, offset)
  }
  tokenizeWord(offset) {
    const start = offset
    let character
    while (
      (character = this.cssText[offset]) &&
      !matcher.boundary.test(character)
    ) {
      offset++
    }
    return new Token(Token.type.word, start, offset)
  }
  tokenizeWhitespace(offset) {
    const start = offset
    matcher.whitespaceGreedy.lastIndex = offset
    const match = matcher.whitespaceGreedy.exec(this.cssText)
    if (match != null && match.index === offset) {
      offset = matcher.whitespaceGreedy.lastIndex
    }
    return new Token(Token.type.whitespace, start, offset)
  }
  tokenizeComment(offset) {
    const start = offset
    matcher.commentGreedy.lastIndex = offset
    const match = matcher.commentGreedy.exec(this.cssText)
    if (match == null) {
      offset = this.cssText.length
    } else {
      offset = matcher.commentGreedy.lastIndex
    }
    return new Token(Token.type.comment, start, offset)
  }
  tokenizeBoundary(offset) {
    const type =
      boundaryTokenTypes[this.cssText[offset]] || Token.type.boundary
    return new Token(type, offset, offset + 1)
  }
}

// --- node-factory ---

class NodeFactory {
  stylesheet(rules, range) {
    return { type: nodeType.stylesheet, rules, range }
  }
  atRule(
    name,
    parameters,
    rulelist = undefined,
    nameRange,
    parametersRange,
    range
  ) {
    return {
      type: nodeType.atRule,
      name,
      parameters,
      rulelist,
      nameRange,
      parametersRange,
      range,
    }
  }
  comment(value, range) {
    return { type: nodeType.comment, value, range }
  }
  rulelist(rules, range) {
    return { type: nodeType.rulelist, rules, range }
  }
  ruleset(selector, rulelist, selectorRange, range) {
    return { type: nodeType.ruleset, selector, rulelist, selectorRange, range }
  }
  declaration(name, value, nameRange, range) {
    return { type: nodeType.declaration, name, value, nameRange, range }
  }
  expression(text, range) {
    return { type: nodeType.expression, text, range }
  }
  discarded(text, range) {
    return { type: nodeType.discarded, text, range }
  }
}

// --- node-visitor ---

class NodeVisitor {
  constructor() {
    this.path_ = []
  }
  get path() {
    return this.path_
  }
  visit(node) {
    let result
    const callback = this[node.type]
    if (callback) {
      this.path_.push(node)
      result = this[node.type](node)
      this.path_.pop()
    }
    return result
  }
}

// --- parser ---

class Parser {
  constructor(nodeFactory = new NodeFactory()) {
    this.nodeFactory = nodeFactory
  }
  parse(cssText) {
    return this.parseStylesheet(new Tokenizer(cssText))
  }
  parseStylesheet(tokenizer) {
    return this.nodeFactory.stylesheet(this.parseRules(tokenizer), {
      start: 0,
      end: tokenizer.cssText.length,
    })
  }
  parseRules(tokenizer) {
    const rules = []
    while (tokenizer.currentToken) {
      const rule = this.parseRule(tokenizer)
      if (rule) {
        rules.push(rule)
      }
    }
    return rules
  }
  parseRule(tokenizer) {
    const token = tokenizer.currentToken
    if (token === null) {
      return null
    }
    if (token.is(Token.type.whitespace)) {
      tokenizer.advance()
      return null
    } else if (token.is(Token.type.comment)) {
      return this.parseComment(tokenizer)
    } else if (token.is(Token.type.word)) {
      return this.parseDeclarationOrRuleset(tokenizer)
    } else if (token.is(Token.type.propertyBoundary)) {
      return this.parseUnknown(tokenizer)
    } else if (token.is(Token.type.at)) {
      return this.parseAtRule(tokenizer)
    } else {
      return this.parseUnknown(tokenizer)
    }
  }
  parseComment(tokenizer) {
    const token = tokenizer.advance()
    if (token === null) {
      return null
    }
    return this.nodeFactory.comment(tokenizer.slice(token), {
      start: token.start,
      end: token.end,
    })
  }
  parseUnknown(tokenizer) {
    const start = tokenizer.advance()
    let end
    if (start === null) {
      return null
    }
    while (
      tokenizer.currentToken &&
      tokenizer.currentToken.is(Token.type.boundary)
    ) {
      end = tokenizer.advance()
    }
    return this.nodeFactory.discarded(
      tokenizer.slice(start, end),
      tokenizer.getRange(start, end)
    )
  }
  parseAtRule(tokenizer) {
    let name = undefined
    let nameRange = undefined
    let rulelist = undefined
    let parametersStart = undefined
    let parametersEnd = undefined
    if (!tokenizer.currentToken) {
      return null
    }
    const start = tokenizer.currentToken.start
    while (tokenizer.currentToken) {
      if (tokenizer.currentToken.is(Token.type.whitespace)) {
        tokenizer.advance()
      } else if (!name && tokenizer.currentToken.is(Token.type.at)) {
        tokenizer.advance()
        const start = tokenizer.currentToken
        let end
        while (
          tokenizer.currentToken &&
          tokenizer.currentToken.is(Token.type.word)
        ) {
          end = tokenizer.advance()
        }
        nameRange = tokenizer.getRange(start, end)
        name = tokenizer.cssText.slice(nameRange.start, nameRange.end)
      } else if (tokenizer.currentToken.is(Token.type.openBrace)) {
        rulelist = this.parseRulelist(tokenizer)
        break
      } else if (tokenizer.currentToken.is(Token.type.propertyBoundary)) {
        tokenizer.advance()
        break
      } else {
        if (parametersStart == null) {
          parametersStart = tokenizer.advance()
        } else {
          parametersEnd = tokenizer.advance()
        }
      }
    }
    if (name === undefined || nameRange === undefined) {
      return null
    }
    let parametersRange = undefined
    let parameters = ''
    if (parametersStart) {
      parametersRange = tokenizer.trimRange(
        tokenizer.getRange(parametersStart, parametersEnd)
      )
      parameters = tokenizer.cssText.slice(
        parametersRange.start,
        parametersRange.end
      )
    }
    const end = tokenizer.currentToken
      ? tokenizer.currentToken.previous.end
      : tokenizer.cssText.length
    return this.nodeFactory.atRule(
      name,
      parameters,
      rulelist,
      nameRange,
      parametersRange,
      { start, end }
    )
  }
  parseRulelist(tokenizer) {
    const rules = []
    const start = tokenizer.currentToken.start
    let endToken
    tokenizer.advance()
    while (tokenizer.currentToken) {
      if (tokenizer.currentToken.is(Token.type.closeBrace)) {
        endToken = tokenizer.currentToken
        tokenizer.advance()
        break
      } else {
        const rule = this.parseRule(tokenizer)
        if (rule) {
          rules.push(rule)
        }
      }
    }
    const end = endToken ? endToken.end : tokenizer.cssText.length
    return this.nodeFactory.rulelist(rules, { start, end })
  }
  parseDeclarationOrRuleset(tokenizer) {
    let ruleStart = null
    let ruleEnd = null
    let colon = null
    while (tokenizer.currentToken) {
      if (tokenizer.currentToken.is(Token.type.whitespace)) {
        tokenizer.advance()
      } else if (tokenizer.currentToken.is(Token.type.openParenthesis)) {
        while (
          tokenizer.currentToken &&
          !tokenizer.currentToken.is(Token.type.closeParenthesis)
        ) {
          tokenizer.advance()
        }
      } else if (
        tokenizer.currentToken.is(Token.type.openBrace) ||
        tokenizer.currentToken.is(Token.type.propertyBoundary)
      ) {
        break
      } else {
        if (tokenizer.currentToken.is(Token.type.colon)) {
          colon = tokenizer.currentToken
        }
        if (ruleStart === null) {
          ruleStart = tokenizer.advance()
          ruleEnd = ruleStart
        } else {
          ruleEnd = tokenizer.advance()
        }
      }
    }
    if (tokenizer.currentToken === null) {
      return null
    }
    if (tokenizer.currentToken.is(Token.type.propertyBoundary)) {
      const nameRange = tokenizer.getRange(
        ruleStart,
        colon ? colon.previous : ruleEnd
      )
      const declarationName = tokenizer.cssText.slice(
        nameRange.start,
        nameRange.end
      )
      let expression = undefined
      if (colon && colon.next) {
        const rawExpressionRange = tokenizer.getRange(colon.next, ruleEnd)
        const expressionRange = tokenizer.trimRange(rawExpressionRange)
        const expressionValue = tokenizer.cssText.slice(
          expressionRange.start,
          expressionRange.end
        )
        expression = this.nodeFactory.expression(
          expressionValue,
          expressionRange
        )
      }
      if (tokenizer.currentToken.is(Token.type.semicolon)) {
        tokenizer.advance()
      }
      const range = tokenizer.trimRange(
        tokenizer.getRange(
          ruleStart,
          (tokenizer.currentToken && tokenizer.currentToken.previous) ||
            ruleEnd
        )
      )
      return this.nodeFactory.declaration(
        declarationName,
        expression,
        nameRange,
        range
      )
    } else if (colon && colon === ruleEnd) {
      const rulelist = this.parseRulelist(tokenizer)
      if (tokenizer.currentToken.is(Token.type.semicolon)) {
        tokenizer.advance()
      }
      const nameRange = tokenizer.getRange(ruleStart, ruleEnd.previous)
      const declarationName = tokenizer.cssText.slice(
        nameRange.start,
        nameRange.end
      )
      const range = tokenizer.trimRange(
        tokenizer.getRange(
          ruleStart,
          (tokenizer.currentToken && tokenizer.currentToken.previous) ||
            ruleEnd
        )
      )
      return this.nodeFactory.declaration(
        declarationName,
        rulelist,
        nameRange,
        range
      )
    } else {
      const selectorRange = tokenizer.getRange(ruleStart, ruleEnd)
      const selector = tokenizer.cssText.slice(
        selectorRange.start,
        selectorRange.end
      )
      const rulelist = this.parseRulelist(tokenizer)
      const start = ruleStart.start
      let end
      if (tokenizer.currentToken) {
        end = tokenizer.currentToken.previous
          ? tokenizer.currentToken.previous.end
          : ruleStart.end
      } else {
        end = tokenizer.cssText.length
      }
      return this.nodeFactory.ruleset(selector, rulelist, selectorRange, {
        start,
        end,
      })
    }
  }
}

// --- stringifier ---

class Stringifier extends NodeVisitor {
  stringify(ast) {
    return this.visit(ast) || ''
  }
  [nodeType.stylesheet](stylesheet) {
    let rules = ''
    for (let i = 0; i < stylesheet.rules.length; ++i) {
      rules += this.visit(stylesheet.rules[i])
    }
    return rules
  }
  [nodeType.atRule](atRule) {
    return (
      `@${atRule.name}` +
      (atRule.parameters ? ` ${atRule.parameters}` : '') +
      (atRule.rulelist ? `${this.visit(atRule.rulelist)}` : ';')
    )
  }
  [nodeType.rulelist](rulelist) {
    let rules = '{'
    for (let i = 0; i < rulelist.rules.length; ++i) {
      rules += this.visit(rulelist.rules[i])
    }
    return rules + '}'
  }
  [nodeType.comment](comment) {
    return `${comment.value}`
  }
  [nodeType.ruleset](ruleset) {
    return `${ruleset.selector}${this.visit(ruleset.rulelist)}`
  }
  [nodeType.declaration](declaration) {
    return declaration.value != null
      ? `${declaration.name}:${this.visit(declaration.value)};`
      : `${declaration.name};`
  }
  [nodeType.expression](expression) {
    return `${expression.text}`
  }
  [nodeType.discarded](_discarded) {
    return ''
  }
}

export { Parser, Stringifier, nodeType }
