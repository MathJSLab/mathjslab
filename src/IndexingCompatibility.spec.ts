/// <reference types="jest" />
import { Interpreter } from './Interpreter';

describe('MATLAB/Octave indexing compatibility fixtures.', () => {
    it('Should preserve matrix values assigned into cell contents.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('C = {0}; C{1} = [1, 2]; C'))).toBe('C={[1,2]}\nC={[1,2]}\n{[1,2]}\n');
    });

    it('Should assign through chained cell-content indexing.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('C = {[1, 2, 3]}; C{1}(end+1) = 4; C{1}'))).toBe('C={[1,2,3]}\nC={[1,2,3,4]}\n[1,2,3,4]\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {[1, 2, 3, 4]}; C{1}([true, false, true, false]) = []; C{1}'))).toBe('C={[1,2,3,4]}\nC={[2,4]}\n[2,4]\n');
    });

    it('Should assign through chained structure-field indexing.', () => {
        const interpreter = Interpreter.Create();
        const nestedInterpreter = Interpreter.Create();
        const structureArrayInterpreter = Interpreter.Create();
        const undefinedRootInterpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('S.x = [1, 2, 3, 4]; S.x([false, true, false, true]) = 9; S.x'))).toBe(
            'S=struct {\nx: [1,2,3,4]\n}\nS=struct {\nx: [1,9,3,9]\n}\n[1,9,3,9]\n',
        );
        expect(nestedInterpreter.Unparse(nestedInterpreter.Execute('S(1).items = {[10, 20, 30]}; S(1).items{1}(end) = 99; S(1).items{1}'))).toBe(
            'S=[struct {\nitems: {[10,20,30]}\n}]\nS=[struct {\nitems: {[10,20,99]}\n}]\n[10,20,99]\n',
        );
        expect(structureArrayInterpreter.Unparse(structureArrayInterpreter.Execute('S.branch = [struct("id", 1), struct("id", 2)]; S.branch.leaf = 42; S.branch.leaf'))).toBe(
            'S=struct {\nbranch: [struct {\nid: 1\nleaf: 42\n},struct {\nid: 2\nleaf: 42\n}]\n}\nS=struct {\nbranch: [struct {\nid: 1\nleaf: 42\n},struct {\nid: 2\nleaf: 42\n}]\n}\n42\n42\n',
        );
        expect(undefinedRootInterpreter.Unparse(undefinedRootInterpreter.Execute('S(1).branch(1).id = 1; S(1).branch(2).id = 2; S.branch.id'))).toBe(
            'S=[struct {\nbranch: [struct {\nid: 1\n}]\n}]\nS=[struct {\nbranch: [struct {\nid: 1\n},struct {\nid: 2\n}]\n}]\n1\n2\n',
        );
    });

    it('Should keep row, column, logical, and end-based indexing stable.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3; 4, 5, 6]; A(:, 2) = []; A'))).toBe('A=[1,3;\n4,6]\nA=[1,3;\n4,6]\n[1,3;\n4,6]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3; 4, 5, 6]; A(1, :) = []; A'))).toBe('A=[4,5,6]\nA=[4,5,6]\n[4,5,6]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2; 3, 4]; A([true, false; false, true])'))).toBe('A=[1,2;\n3,4]\n[1;\n4]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3]; A(end+1) = 4; A'))).toBe('A=[1,2,3,4]\nA=[1,2,3,4]\n[1,2,3,4]\n');
    });
});
