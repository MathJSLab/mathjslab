/// <reference types="jest" />
import { Interpreter } from '../../src/Interpreter';

describe('MATLAB/Octave indexing compatibility fixtures.', () => {
    it('Should preserve matrix values assigned into cell contents.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('C = {0}; C{1} = [1, 2]; C'))).toBe('C={0}\nC={[1,2]}\n{[1,2]}\n');
    });

    it('Should assign through chained cell-content indexing.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('C = {[1, 2, 3]}; C{1}(end+1) = 4; C{1}'))).toBe('C={[1,2,3]}\nC={[1,2,3,4]}\n[1,2,3,4]\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {[1, 2, 3]}; C{1}(end) = []; C{1}'))).toBe('C={[1,2,3]}\nC={[1,2]}\n[1,2]\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {[1, 2, 3, 4]}; C{1}([true, false, true, false]) = []; C{1}'))).toBe('C={[1,2,3,4]}\nC={[2,4]}\n[2,4]\n');
        expect(interpreter.Unparse(interpreter.Execute('ImplicitCell(2) = {8}; ImplicitCell'))).toBe('ImplicitCell={[ ](0x0),8}\n{[ ](0x0),8}\n');
        expect(interpreter.Unparse(interpreter.Execute('ImplicitRangeCell(2:3) = {8, 9}; ImplicitRangeCell'))).toBe('ImplicitRangeCell={[ ](0x0),8,9}\n{[ ](0x0),8,9}\n');
        expect(interpreter.Unparse(interpreter.Execute('ImplicitContentCell{2} = 8; ImplicitContentCell'))).toBe('ImplicitContentCell={[ ](0x0),8}\n{[ ](0x0),8}\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {}; C(2) = {8}; C'))).toBe('C={ }(0x0)\nC={[ ](0x0),8}\n{[ ](0x0),8}\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1}; C(2:3) = {8, 9}; C'))).toBe('C={1}\nC={1,8,9}\n{1,8,9}\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {}; C{2} = 8; C'))).toBe('C={ }(0x0)\nC={[ ](0x0),8}\n{[ ](0x0),8}\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1}; C{3} = 8; C'))).toBe('C={1}\nC={1,[ ](0x0),8}\n{1,[ ](0x0),8}\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2, 3}; C(2) = []; C'))).toBe('C={1,2,3}\nC={1,3}\n{1,3}\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2, 3}; C([1, 3]) = []; C'))).toBe('C={1,2,3}\nC={2}\n{2}\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2, 3}; C{2} = []; C'))).toBe('C={1,2,3}\nC={1,[ ](0x0),3}\n{1,[ ](0x0),3}\n');
        expect(() => interpreter.Execute('C = {1}; C(2) = 8')).toThrow('cell array assignment requires a cell array value.');
        expect(() => interpreter.Execute('A = [1, 2]; A(2) = {8}')).toThrow('cell array assignment requires a cell array target.');
        expect(() => interpreter.Execute('A = [1, 2]; A{2} = 8')).toThrow('matrix cannot be indexed with {');
    });

    it('Should assign to comma-separated cell contents through evaluated index lists.', () => {
        const interpreter = Interpreter.Create();

        const source = 'C = {0, 0, 0}; idx = [1, 3]; [C{idx}] = deal(7, 9); C';

        expect(interpreter.Unparse(interpreter.Execute(source))).toBe('C={0,0,0}\nidx=[1,3]\nC={7,0,0}\nC={7,0,9}\n{7,0,9}\n');
    });

    it('Should propagate comma-separated receivers through chained indexing.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('C={struct("x",1), struct("x",2)}; [a,b]=C{:}.x; [a,b]'))).toBe('C={struct {\nx: 1\n},struct {\nx: 2\n}}\na=1\nb=2\n[1,2]\n');
        expect(interpreter.Unparse(interpreter.Execute('C={[10,20],[30,40]}; [a,b]=C{:}(2); [a,b]'))).toBe('C={[10,20],[30,40]}\na=20\nb=40\n[20,40]\n');
        expect(interpreter.Unparse(interpreter.Execute('C={struct("x",[1,2]), struct("x",[3,4])}; [a,b]=C{:}.x(2); [a,b]'))).toBe(
            'C={struct {\nx: [1,2]\n},struct {\nx: [3,4]\n}}\na=2\nb=4\n[2,4]\n',
        );
        expect(interpreter.Unparse(interpreter.Execute('S(1).c={10,20}; S(2).c={30,40}; [a,b]=S.c{1}; [a,b]'))).toBe(
            'S=[struct {\nc: {10,20}\n}]\nS=[struct {\nc: {10,20}\n},struct {\nc: {30,40}\n}]\na=10\nb=30\n[10,30]\n',
        );
    });

    it('Should distribute deal outputs with MATLAB/Octave comma-list semantics.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('[a, b, c] = deal(5); [x, y] = deal(7, 9); a; b; c; x; y'))).toBe('a=5\nb=5\nc=5\nx=7\ny=9\n5\n5\n5\n7\n9\n');
        expect(interpreter.Unparse(interpreter.Execute('[~, right] = deal(7, 9); right'))).toBe('right=9\n9\n');
        expect(interpreter.Unparse(interpreter.Execute('nargin("deal"); nargout("deal")'))).toBe('-1\n-1\n');
        expect(() => interpreter.Execute('[a, b, c] = deal(1, 2)')).toThrow('deal: nargin and nargout must match unless there is exactly one input.');
        expect(() => interpreter.Execute('deal()')).toThrow('Invalid call to deal.');
    });

    it('Should assign through chained structure-field indexing.', () => {
        const interpreter = Interpreter.Create();
        const nestedInterpreter = Interpreter.Create();
        const chainedFieldEndInterpreter = Interpreter.Create();
        const chainedCellEndInterpreter = Interpreter.Create();
        const chainedCellDeletionInterpreter = Interpreter.Create();
        const indexedFieldInterpreter = Interpreter.Create();
        const indexedStructSetInterpreter = Interpreter.Create();
        const indexedStructDeleteInterpreter = Interpreter.Create();
        const indexedCellFieldDeleteInterpreter = Interpreter.Create();
        const indexedCellFieldBraceInterpreter = Interpreter.Create();
        const structureArrayInterpreter = Interpreter.Create();
        const undefinedRootInterpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('S.x = [1, 2, 3, 4]; S.x([false, true, false, true]) = 9; S.x'))).toBe(
            'S=struct {\nx: [1,2,3,4]\n}\nS=struct {\nx: [1,9,3,9]\n}\n[1,9,3,9]\n',
        );
        expect(nestedInterpreter.Unparse(nestedInterpreter.Execute('S(1).items = {[10, 20, 30]}; S(1).items{1}(end) = 99; S(1).items{1}'))).toBe(
            'S=[struct {\nitems: {[10,20,30]}\n}]\nS=[struct {\nitems: {[10,20,99]}\n}]\n[10,20,99]\n',
        );
        expect(chainedFieldEndInterpreter.Unparse(chainedFieldEndInterpreter.Execute('S.values = [10, 20, 30]; S.values(end); S.values(end) = []; S.values'))).toBe(
            'S=struct {\nvalues: [10,20,30]\n}\n30\nS=struct {\nvalues: [10,20]\n}\n[10,20]\n',
        );
        expect(chainedCellEndInterpreter.Unparse(chainedCellEndInterpreter.Execute('S.cells = {10, 20, 30}; S.cells{end}; S.cells{end} = 99; S.cells'))).toBe(
            'S=struct {\ncells: {10,20,30}\n}\n30\nS=struct {\ncells: {10,20,99}\n}\n{10,20,99}\n',
        );
        expect(chainedCellDeletionInterpreter.Unparse(chainedCellDeletionInterpreter.Execute('S.cells = {10, 20, 30}; S.cells(end) = []; S.cells'))).toBe(
            'S=struct {\ncells: {10,20,30}\n}\nS=struct {\ncells: {10,20}\n}\n{10,20}\n',
        );
        expect(indexedFieldInterpreter.Unparse(indexedFieldInterpreter.Execute('IndexedField.x = [1, 2, 3]; IndexedField.x(2) = []; IndexedField.x'))).toBe(
            'IndexedField=struct {\nx: [1,2,3]\n}\nIndexedField=struct {\nx: [1,3]\n}\n[1,3]\n',
        );
        expect(indexedStructSetInterpreter.Unparse(indexedStructSetInterpreter.Execute('IndexedStruct(1).x = [1, 2, 3]; IndexedStruct(1).x(2) = 9; IndexedStruct(1).x'))).toBe(
            'IndexedStruct=[struct {\nx: [1,2,3]\n}]\nIndexedStruct=[struct {\nx: [1,9,3]\n}]\n[1,9,3]\n',
        );
        expect(indexedStructDeleteInterpreter.Unparse(indexedStructDeleteInterpreter.Execute('IndexedStruct(1).x = [1, 2, 3]; IndexedStruct(1).x(2) = []; IndexedStruct(1).x'))).toBe(
            'IndexedStruct=[struct {\nx: [1,2,3]\n}]\nIndexedStruct=[struct {\nx: [1,3]\n}]\n[1,3]\n',
        );
        expect(
            indexedCellFieldDeleteInterpreter.Unparse(indexedCellFieldDeleteInterpreter.Execute('IndexedCellField(1).x = {1, 2, 3}; IndexedCellField(1).x(2) = []; IndexedCellField(1).x')),
        ).toBe('IndexedCellField=[struct {\nx: {1,2,3}\n}]\nIndexedCellField=[struct {\nx: {1,3}\n}]\n{1,3}\n');
        expect(
            indexedCellFieldBraceInterpreter.Unparse(indexedCellFieldBraceInterpreter.Execute('IndexedCellField(1).x = {1, 2, 3}; IndexedCellField(1).x{2} = []; IndexedCellField(1).x')),
        ).toBe('IndexedCellField=[struct {\nx: {1,2,3}\n}]\nIndexedCellField=[struct {\nx: {1,[ ](0x0),3}\n}]\n{1,[ ](0x0),3}\n');
        expect(structureArrayInterpreter.Unparse(structureArrayInterpreter.Execute('S.branch = [struct("id", 1), struct("id", 2)]; S.branch.leaf = 42; S.branch.leaf'))).toBe(
            'S=struct {\nbranch: [struct {\nid: 1\n},struct {\nid: 2\n}]\n}\nS=struct {\nbranch: [struct {\nid: 1\nleaf: 42\n},struct {\nid: 2\nleaf: 42\n}]\n}\n42\n42\n',
        );
        expect(undefinedRootInterpreter.Unparse(undefinedRootInterpreter.Execute('S(1).branch(1).id = 1; S(1).branch(2).id = 2; S.branch.id'))).toBe(
            'S=[struct {\nbranch: [struct {\nid: 1\n}]\n}]\nS=[struct {\nbranch: [struct {\nid: 1\n},struct {\nid: 2\n}]\n}]\n1\n2\n',
        );
        expect(interpreter.Unparse(interpreter.Execute('S = []; S.x = 5; S.x'))).toBe('S=[ ](0x0)\nS=struct {\nx: 5\n}\n5\n');
        expect(interpreter.Unparse(interpreter.Execute('T = []; T.x.y = 6; T.x.y'))).toBe('T=[ ](0x0)\nT=struct {\nx: struct {\ny: 6\n}\n}\n6\n');
        expect(interpreter.Unparse(interpreter.Execute('U = []; U(2).x = 5; U.x'))).toBe('U=[ ](0x0)\nU=[struct {\nx: [ ](0x0)\n},struct {\nx: 5\n}]\n[ ](0x0)\n5\n');
        expect(interpreter.Unparse(interpreter.Execute('V = []; V(2).x.y = 6; V(2).x.y'))).toBe('V=[ ](0x0)\nV=[struct {\nx: [ ](0x0)\n},struct {\nx: struct {\ny: 6\n}\n}]\n6\n');
        expect(interpreter.Unparse(interpreter.Execute('W = []; W(2).x(3) = 7; W(2).x'))).toBe('W=[ ](0x0)\nW=[struct {\nx: [ ](0x0)\n},struct {\nx: [0,0,7]\n}]\n[0,0,7]\n');
        expect(() => interpreter.Execute('C = {}; C.x = 5')).toThrow('in indexed assignment.');
    });

    it('Should expand structure field comma lists on the left side of multiple assignment.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('S(1).x = 1; S(2).x = 2; [S.x] = deal(7, 8); S.x'))).toBe(
            'S=[struct {\nx: 1\n}]\nS=[struct {\nx: 1\n},struct {\nx: 2\n}]\nS=[struct {\nx: 7\n},struct {\nx: 2\n}]\nS=[struct {\nx: 7\n},struct {\nx: 8\n}]\n7\n8\n',
        );
        expect(interpreter.Unparse(interpreter.Execute('T(1).x = 1; T(2).x = 2; [T(:).x] = deal(9); T.x'))).toBe(
            'T=[struct {\nx: 1\n}]\nT=[struct {\nx: 1\n},struct {\nx: 2\n}]\nT=[struct {\nx: 9\n},struct {\nx: 2\n}]\nT=[struct {\nx: 9\n},struct {\nx: 9\n}]\n9\n9\n',
        );
        expect(interpreter.Unparse(interpreter.Execute('U(1).x = 1; U(2).x = 2; idx = [2, 1]; [U(idx).x] = deal(20, 10); U.x'))).toBe(
            'U=[struct {\nx: 1\n}]\nU=[struct {\nx: 1\n},struct {\nx: 2\n}]\nidx=[2,1]\nU=[struct {\nx: 1\n},struct {\nx: 20\n}]\nU=[struct {\nx: 10\n},struct {\nx: 20\n}]\n10\n20\n',
        );
    });

    it('Should keep row, column, logical, and end-based indexing stable.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3; 4, 5, 6]; A(:, 2) = []; A'))).toBe('A=[1,2,3;\n4,5,6]\nA=[1,3;\n4,6]\n[1,3;\n4,6]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3; 4, 5, 6]; A(1, :) = []; A'))).toBe('A=[1,2,3;\n4,5,6]\nA=[4,5,6]\n[4,5,6]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2; 3, 4]; A([true, false; false, true])'))).toBe('A=[1,2;\n3,4]\n[1;\n4]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3, 4]; A([true, false, true, false])'))).toBe('A=[1,2,3,4]\n[1,3]\n');
        expect(interpreter.Unparse(interpreter.Execute('Column = [1; 2; 3; 4]; Column([true, false, true, false])'))).toBe('Column=[1;\n2;\n3;\n4]\n[1;\n3]\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2, 3, 4}; C([true, false, true, false])'))).toBe('C={1,2,3,4}\n{1,3}\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3]; A([1, 2, 3]); A(:)'))).toBe('A=[1,2,3]\n[1,2,3]\n[1;\n2;\n3]\n');
        expect(interpreter.Unparse(interpreter.Execute('Column = [1; 2; 3]; Column([1, 2])'))).toBe('Column=[1;\n2;\n3]\n[1;\n2]\n');
        expect(interpreter.Unparse(interpreter.Execute('M = [1, 2; 3, 4]; M([1, 4; 2, 3])'))).toBe('M=[1,2;\n3,4]\n[1,4;\n3,2]\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2}; C([1, 2]); C(:)'))).toBe('C={1,2}\n{1,2}\n{1;\n2}\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3]; A([1, 2, 3]) = [9, 8, 7]; A'))).toBe('A=[1,2,3]\nA=[9,8,7]\n[9,8,7]\n');
        expect(interpreter.Unparse(interpreter.Execute('M = [1, 2; 3, 4]; M([1, 4; 2, 3]) = [10, 40; 30, 20]; M'))).toBe('M=[1,2;\n3,4]\nM=[10,20;\n30,40]\n[10,20;\n30,40]\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2}; C([1, 2]) = {9, 8}; C'))).toBe('C={1,2}\nC={9,8}\n{9,8}\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3, 4]; A([true, false, true, false]) = [9, 7]; A'))).toBe('A=[1,2,3,4]\nA=[9,2,7,4]\n[9,2,7,4]\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2, 3, 4}; C([true, false, true, false]) = {9, 7}; C'))).toBe('C={1,2,3,4}\nC={9,2,7,4}\n{9,2,7,4}\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3, 4]; A([1, 4]) = []; A'))).toBe('A=[1,2,3,4]\nA=[2,3]\n[2,3]\n');
        expect(interpreter.Unparse(interpreter.Execute('Column = [1; 2; 3; 4]; Column([1, 4]) = []; Column'))).toBe('Column=[1;\n2;\n3;\n4]\nColumn=[2;\n3]\n[2;\n3]\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2, 3, 4}; C([1, 4]) = []; C'))).toBe('C={1,2,3,4}\nC={2,3}\n{2,3}\n');
        expect(interpreter.Unparse(interpreter.Execute('Column = [1; 2; 3; 4]; Column([true, false, true, false]) = []; Column'))).toBe('Column=[1;\n2;\n3;\n4]\nColumn=[2;\n4]\n[2;\n4]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3; 4, 5, 6]; A(:, end)'))).toBe('A=[1,2,3;\n4,5,6]\n[3;\n6]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3; 4, 5, 6]; A(end, :)'))).toBe('A=[1,2,3;\n4,5,6]\n[4,5,6]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3; 4, 5, 6]; A(1, end) = 9; A'))).toBe('A=[1,2,3;\n4,5,6]\nA=[1,2,9;\n4,5,6]\n[1,2,9;\n4,5,6]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3; 4, 5, 6]; A(:, end) = []; A'))).toBe('A=[1,2,3;\n4,5,6]\nA=[1,2;\n4,5]\n[1,2;\n4,5]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3; 4, 5, 6]; A(end, :) = []; A'))).toBe('A=[1,2,3;\n4,5,6]\nA=[1,2,3]\n[1,2,3]\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2, 3; 4, 5, 6}; C{end, end}'))).toBe('C={1,2,3;\n4,5,6}\n6\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2, 3; 4, 5, 6}; C{end, end} = 9; C'))).toBe('C={1,2,3;\n4,5,6}\nC={1,2,3;\n4,5,9}\n{1,2,3;\n4,5,9}\n');
        expect(interpreter.Unparse(interpreter.Execute('C = {1, 2, 3; 4, 5, 6}; C(:, end) = []; C'))).toBe('C={1,2,3;\n4,5,6}\nC={1,2;\n4,5}\n{1,2;\n4,5}\n');
        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3]; A(end+1) = 4; A'))).toBe('A=[1,2,3]\nA=[1,2,3,4]\n[1,2,3,4]\n');
        expect(interpreter.Unparse(interpreter.Execute('A = []; A(3) = 5; A'))).toBe('A=[ ](0x0)\nA=[0,0,5]\n[0,0,5]\n');
    });

    it('Should keep compound indexed assignment on evaluated subscripts.', () => {
        const interpreter = Interpreter.Create();

        expect(interpreter.Unparse(interpreter.Execute('A = [1, 2, 3]; k = 2; A(k) += 10; A'))).toBe('A=[1,2,3]\nk=2\nA=[1,12,3]\n[1,12,3]\n');
    });

    it('Should reject non-native subscript values before native indexing.', () => {
        const interpreter = Interpreter.Create();

        expect(() => interpreter.Execute('A = [1, 2, 3]; A("x")')).toThrow(/index1: invalid subscript type/);
        expect(() => interpreter.Execute('A = [1, 2, 3]; A("x") = 9')).toThrow(/index1: invalid subscript type/);
    });
});
