clear
% Test array indexing at right side of assignment.
count5x5 = [1,2,3,4,5;6,7,8,9,10;11,12,13,14,15;16,17,18,19,20;21,22,23,24,25]
magic_7=[30,39,48,1,10,19,28;38,47,7,9,18,27,29;46,6,8,17,26,35,37;5,14,16,25,34,36,45;13,15,24,33,42,44,4;21,23,32,41,43,3,12;22,31,40,49,2,11,20] % magic(7)
A = [1,2,3; 4,5,6; 7,8,9]
test_result_indexing_right(1,1) = isequal(A(1), A(1))
test_result_indexing_right(2,1) = isequal(A(2), A(2))
test_result_indexing_right(3,1) = isequal(A(3), A(3))
test_result_indexing_right(4,1) = isequal(A(4), A(4))
test_result_indexing_right(5,1) = isequal(A(5), A(5))
A(10) % error
test_result_indexing_right(6,1) = isequal(A(2,3), A(2,3))
A(4,3) % error
A = [1,2,3,4,5,6,7,8,9]
test_result_indexing_right(7,1) = isequal(A(1), A(1))
test_result_indexing_right(8,1) = isequal(A(2), A(2))
test_result_indexing_right(9,1) = isequal(A(3), A(3))
test_result_indexing_right(10,1) = isequal(A(4), A(4))
test_result_indexing_right(11,1) = isequal(A(5), A(5))
A(10) % error
A(2,3) % error
A(4,3) % error
A = [1,2,3,4,5;6,7,8,9,10]
test_result_indexing_right(12,1) = isequal(A(1), A(1))
test_result_indexing_right(13,1) = isequal(A(2), A(2))
test_result_indexing_right(14,1) = isequal(A(3), A(3))
test_result_indexing_right(15,1) = isequal(A(4), A(4))
test_result_indexing_right(16,1) = isequal(A(5), A(5))
test_result_indexing_right(17,1) = isequal(A(10), A(10))
test_result_indexing_right(18,1) = isequal(A(2,3), A(2,3))
A(4,3) % error
A=magic_7
% by linear index
test_result_indexing_right(19,1) = isequal(A(1), A(1))
test_result_indexing_right(20,1) = isequal(A(3), A(3))
test_result_indexing_right(21,1) = isequal(A(7), A(7))
test_result_indexing_right(22,1) = isequal(A(8), A(8))
test_result_indexing_right(23,1) = isequal(A(15), A(15))
test_result_indexing_right(24,1) = isequal(A(7*7), A(7*7))
% by subscripts
test_result_indexing_right(25,1) = isequal(A(1,1), A(1,1))
test_result_indexing_right(26,1) = isequal(A(1,2), A(1,2))
test_result_indexing_right(27,1) = isequal(A(2,1), A(2,1))
test_result_indexing_right(28,1) = isequal(A, A)
test_result_indexing_right(29,1) = isequal(A([1,2,3;4,5,6]), A([1,2,3;4,5,6]))
test_result_indexing_right(30,1) = isequal(A, A)
test_result_indexing_right(31,1) = isequal(A([1,2;3,4],[1,2,3]), A([1,2;3,4],[1,2,3]))
test_result_indexing_right(32,1) = isequal(A, A)
A(50) % error
A(9,3) % error
A(3,10) % error
A([1,2,3;4,5,9],[1,2,6]) % error
A([1,2,3;4,5,6],[1,2,10]) % error
% Testing dimensions
B=[A,A(1:7,1)]
test_result_indexing_right(33,1) = isequal(size(B), size(B))
test_result_indexing_right(34,1) = isequal(size(B,1), size(B,1))
test_result_indexing_right(35,1) = isequal(size(B,2), size(B,2))
test_result_indexing_right(36,1) = isequal(size(B,1,1), size(B,1,1))
test_result_indexing_right(37,1) = isequal(size(B,[1,2]), size(B,[1,2]))
test_result_indexing_right(38,1) = isequal(size(1), size(1))
C=[]
test_result_indexing_right(39,1) = isequal(size(C), size(C))
A*C % error
C*A % error
test_result_indexing_right(40,1) = isequal(1*C, 1*C)
test_result_indexing_right(41,1) = isequal(C*1, C*1)
test_result_indexing_right(42,1) = isequal(sub2ind ([3,3],[2,2,1,1],[1,3,3,2]), sub2ind ([3,3],[2,2,1,1],[1,3,3,2]))
test_result_indexing_right(43,1) = isequal(sub2ind ([3,3],[2,2;1,1],[1,3;3,2]), sub2ind ([3,3],[2,2;1,1],[1,3;3,2]))
B=[1,2,3;1:3;4,5,6]
B=A^2
C=[A,A(1:7,1)]
D=[]
E=1:7
F=[1:7;2:8]
G=[1:7]'
H=[1:7;2:8]'
test_result_indexing_right(44,1) = isequal([1,2;3,4](1,2), [1,2;3,4](1,2))
% test special indexing ('end' and collon (:))
clear
A = [1,2,3,4,5; 6,7,8,9,10; 11,12,13,14,15]
test_result_indexing_right(45,1) = isequal(A(2,5), A(2,5))
test_result_indexing_right(46,1) = isequal(A(2,end), A(2,end))
test_result_indexing_right(47,1) = isequal(A(3,4), A(3,4))
test_result_indexing_right(48,1) = isequal(A(3,end-1), A(3,end-1))
B = [16,5,9,4,2,11,7,14]
test_result_indexing_right(49,1) = isequal(B([5:8, 1:4]), B([5:8, 1:4]))
test_result_indexing_right(50,1) = isequal(B(1:2:end), B(1:2:end))
test_result_indexing_right(51,1) = isequal(B(end:-1:1), B(end:-1:1))
A = [1,2,8; 4,4,6; 1,8,9]
test_result_indexing_right(52,1) = isequal(A(2,1:end), A(2,1:end))
test_result_indexing_right(53,1) = isequal(A(2,:), A(2,:))
test_result_indexing_right(54,1) = true
test_result_indexing_right(55,1) = true
% test logical indexing
clear
A=[30,39,48,1,10,19,28;38,47,7,9,18,27,29;46,6,8,17,26,35,37;5,14,16,25,34,36,45;13,15,24,33,42,44,4;21,23,32,41,43,3,12;22,31,40,49,2,11,20]
test_result_indexing_right(56,1) = isequal(A(A(22)), A(A(22)))
B=A>29
test_result_indexing_right(57,1) = isequal(A(A>29), A(A>29))
test_result_indexing_right(58,1) = isequal(B, B)
test_result_indexing_right(59,1) = isequal(A(B), A(B))
test_result_indexing_right(60,1) = isequal(B, B)
A(B)=[1,2,3] % error
test_result_indexing_right(61,1) = isequal(B, B)
A(B)=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
test_result_indexing_right(62,1) = isequal(B, B)
A(B)=[99,99,99,99,99;99,99,99,99,99;99,99,99,99,99;99,99,99,99,99]
C=[17,24,1,8,15;23,5,7,14,16;4,6,13,20,22;10,12,19,21,3;11,18,25,2,9]
C(B) % error
test_result_indexing_right(61,1) = isequal(A(C>20), A(C>20))
% logical indexing with operation
A=[30,39,48,1,10,19,28;38,47,7,9,18,27,29;46,6,8,17,26,35,37;5,14,16,25,34,36,45;13,15,24,33,42,44,4;21,23,32,41,43,3,12;22,31,40,49,2,11,20]
A(B)+=[99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99,99] % error
test_result_indexing_right(63,1) = true
% literal logical indexing
test_result_indexing_right(64,1) = isequal([1,2;3,4]([false,false;true,true]), [1,2;3,4]([false,false;true,true]))



complete_test_result_indexing_right = all(test_result_indexing_right)

complete_test_result_indexing_right
