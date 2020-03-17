const expect = require('expect');
const jsonLexer = require('./lexer');
const fs = require('fs');
const path = require('path');

describe('test JSONLexer', () => {
    it('should work as expected 1', () => {
        fs.readFile(path.join(__dirname, "./example1.json"), "utf8", function read(err, data) {
            expect(err).toEqual(null);

            let lexer = new jsonLexer(data.toString());
            let tokens = [];
            let token = lexer.nextToken();

            while (token.type !== jsonLexer.EOF_TYPE) {
                tokens.push(token);
                token = lexer.nextToken();
            }
            expect(tokens.length).toEqual(65);
        });
    });
});