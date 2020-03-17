const EOF = -1;
const EOF_TYPE = 1;

class Lexer {
    constructor(input) {
        this.input = input; // 输入的字符串
        this.index = 0; // 当前字符串的索引位置
        this.char = input[this.index] // 当前字符
    }

    consume() { // 向前移动一个字符
        this.index += 1;
        if (this.index >= this.input.length) { // 判断是否到末尾
            this.char = EOF
        } else {
            this.char = this.input[this.index]
        }
    }

    match(char) { // 判断输入的 char 是否为当前的 this.char
        if (this.char === char) {
            this.consume()
        } else {
            throw new Error(`Expecting ${char}; Found ${this.char}`)
        }
    }
}

Lexer.EOF = EOF;
Lexer.EOF_TYPE = EOF_TYPE;

const LBRACE = 2; // 左花括号
const RBRACE = 3; // 右花括号
const LBRACK = 4; // 左中括号
const RBRACK = 5; // 右中括号
const COMMA = 6; // 逗号
const COLON = 7; // 冒号
const STRING = 8; // JSON 键
const BOOLEAN = 9; // 布尔值
const NULL = 10; // NULL 值

tokenNames = ['n/a', '<EOF>', 'LBRACE', 'RBRACE', 'LBRACK', 'RBRACK', "COMMA", "COLON", "STRING", "BOOLEAN", "NULL"];
const getTokenName = index => tokenNames[index];

// 判断输入字符是否为字母，即在 a-zA-Z 之间
const isLetter = char => char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z';

class JSONLexer extends Lexer {
    constructor(input) {
        super(input)
    }

    isLetter() {
        return isLetter(this.char)
    }

    nextToken() {
        while (this.char !== EOF) {
            switch (this.char) {
                case ' ':
                case '\t':
                case '\n':
                case '\r':
                    this.WS();
                    break;
                case '{':
                    this.consume();
                    return new Token(LBRACE, '{');
                case '}':
                    this.consume();
                    return new Token(RBRACE, '}');
                case '[':
                    this.consume();
                    return new Token(LBRACK, '[');
                case ']':
                    this.consume();
                    return new Token(RBRACK, ']');
                case ',':
                    this.consume();
                    return new Token(COMMA, ',');
                case ':':
                    this.consume();
                    return new Token(COLON, ':');
                case `"`:
                    return this.STRING();
                case "t":
                    return this.TRUE();
                case "f":
                    return this.FALSE();
                case "n":
                    return this.NULL();
                default:
                    throw new Error(`Invalid character: ${this.char}`)
            }
        }
        return new Token(EOF_TYPE, '<EOF>')
    }

    WS() { // 忽略所有空白，换行，tab，回车符等
        while (this.char === ' ' || this.char === '\t' || this.char === '\n' || this.char === '\r') {
            this.consume()
        }
    }

    STRING() { // 匹配一列字母
        let backslashPairCount = 0;
        let str = '';
        this.consume();
        while (this.char !== EOF) {
            if (this.char === "\"") {
                this.consume();
                break;
            } else if (this.char === "\\") {
                this.consume();
                if (this.char === "\\") {
                    str += "\\";
                    this.consume();
                } else if (this.char === "b") {
                    str += '\b';
                    this.consume();
                } else if (this.char === "f") {
                    str += '\f';
                    this.consume();
                } else if (this.char === "n") {
                    str += '\n';
                    this.consume();
                } else if (this.char === "r") {
                    str += '\r';
                    this.consume();
                } else if (this.char === "t") {
                    str += '\t';
                    this.consume();
                } else if (this.char === "/") {
                    str += '\/';
                    this.consume();
                } else if (this.char === "\"") {
                    str += '\"';
                    this.consume();
                } else if (this.char === "u") { // 4 hexadecimal digits
                    this.consume();
                    let hexCode = this.LookAhead(4);
                    if (hexCode.length === 4) {
                        for (let i = 0; i < 4; i++) {
                            if (!((hexCode[i] >= 0x00 && hexCode[i] <= 0x09) || (hexCode[i] >= 0x61 && hexCode[i] <= 0x7A) || (hexCode[i] >= 0x41 && hexCode[i] <= 0x5A))) {
                                throw new Error(`Invalid 4 hexadecimal digits value: ${str}`)
                            } else {
                                this.consume();
                            }
                        }
                    }
                    str += "\\u" + hexCode
                } else {
                    throw new Error(`Invalid STRING value: ${str}`)
                }
            } else {
                str += this.char;
                this.consume();
            }
        }

        return new Token(STRING, str);
    }

    TRUE() {
        let boolean = this.LookAhead(4);
        if (boolean === "true") {
            return new Token(BOOLEAN, "true")
        } else {
            throw new Error(`Invalid TRUE value: ${boolean}`)
        }
    }

    FALSE() {
        let boolean = this.LookAhead(5);
        if (boolean === "false") {
            return new Token(BOOLEAN, "false")
        } else {
            throw new Error(`Invalid FALSE value: ${boolean}`)
        }
    }

    NULL() {
        let nil = '';
        for (let i = 0; i < 4; i++) {
            if (this.char !== EOF) {
                nil += this.char;
                this.consume();
            }
        }
        if (nil === "null") {
            return new Token(NULL, "null")
        } else {
            throw new Error(`Invalid NULL value: ${nil}`)
        }
    }

    LookAhead(cnt) {
        let str = '';
        for (let i = 0; i < cnt; i++) {
            if (this.char !== EOF) {
                str += this.char;
                this.consume();
            }
        }
        return str;
    }
}

class Token {
    constructor(type, text) {
        this.type = type;
        this.text = text
    }

    toString() {
        let tokenName = tokenNames[this.type];
        return this.text + "," + tokenName;
    }
}

class Parser {
    constructor(lexer) {
        this.lexer = lexer;
        this.lookahead = this.consume();
    }

    consume() {
        this.lookahead[this.index] = this.lexer.nextToken();
    }

    match(type) {
        if (this.lookahead.type === type) {
            this.consume()
        } else {
            throw new Error(`Expecting ${getTokenName(type)}; Found ${this.getToken()}`)
        }
    }
}

class JSONParser extends Parser {
    array() {
        this.match(LBRACK);
        this.jsonElements();
        this.match(RBRACK);
    }

    jsonElements() {
        this.jsonElement();
        while (this.lookahead.type === COMMA) {
            this.match(COMMA);
            this.jsonElement();
        }
    }

    jsonElement() {
        throw new Error(`Expecting name or list; Found ${this.getToken(1)}`)
    }
}