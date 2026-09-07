clear
% Test array indexing at left side of assignment.
A = [1,2,3; 4,5,6; 7,8,9]
A(2,2) = 999
A(9) = 100
A(10) = 100 % error
A([4,5,6])=[101,102,103]
A(3) = 99
A(2, [1,2,3])=[11;12;13]
A(1, [1,2,7])=[14;15;16]
A([1,2,3], 1)=[17;18;19]
A([1,2,3], 1)=[21,22,23]
C(1,5)=1
D(8,6)=9
A = [1,2,3; 4,5,6; 7,8,9]
test_result_indexing_left(1,1) = isequal(A(2, [1,2,3])+=[11,12,13], A(2, [1,2,3])+=[11,12,13])
A(2, [1,2,3])+=[11;12;13] % error
F(5) = 9
A(3,3) = 99
A(3,3,2) = 88
test_result_indexing_left(2,1) = isequal(A(3,3,2), A(3,3,2))
A(2,2,2,3) = 77
test_result_indexing_left(3,1) = isequal(A(2,2,2,3), A(2,2,2,3))


complete_test_result_indexing_left = all(test_result_indexing_left)

complete_test_result_indexing_left
