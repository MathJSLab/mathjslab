clear % clear all variables

% Test indexing function.
[A,B,C,D]=ind2sub([4, 3], [1, 2; 3, 4; 5, 6])
[a,b,c,d,E,f]=ind2sub([4, 3], 1)
[a,b,c,d,E,f]=ind2sub([4, 3], 2)
[a,b,c,d,E,f]=ind2sub([4, 3], 3)
[a,b,c,d,E,f]=ind2sub([4, 3], 4)
[a,b,c,d,E,f]=ind2sub([4, 3], 5)
[a,b,c,d,E,f]=ind2sub([4, 3], 6)
[a,b,c,d,E,f]=ind2sub([4, 3], 7)
[a,b,c,d,E,f]=ind2sub([4, 3], 8)
[a,b,c,d,E,f]=ind2sub([4, 3], 9)
[a,b,c,d,E,f]=ind2sub([4, 3], 10)
[a,b,c,d,E,f]=ind2sub([4, 3], 11)
[a,b,c,d,E,f]=ind2sub([4, 3], 12)
[a,b,c,d,E,f]=ind2sub([4, 3], 13)
[a,b,c,d,E,f]=ind2sub([4, 3], 14)
[a,b,c,d,E,f]=ind2sub([4, 3], 15)
%
[a]=ind2sub([4, 3], 96)
[a,b]=ind2sub([4, 3], 96)
[a,b,c]=ind2sub([4, 3], 96)
[a,b,c,d]=ind2sub([4, 3], 96)
[a,b,c,d,E]=ind2sub([4, 3], 96)
[a,b,c,d,E,f]=ind2sub([4, 3], 96)
%
[a,b,c]=ind2sub([4, 3], 94)
[a,b,c]=ind2sub([4, 3], 95)
[a,b,c]=ind2sub([4, 3], 96)
[a,b,c]=ind2sub([4, 3], 97)
[a,b,c]=ind2sub([4, 3], 98)
[a,b,c]=ind2sub([4, 3], 99)
%
test_result_indexing_function(1,1) = isequal(sub2ind([4,3], 1, 1), sub2ind([4,3], 1, 1))
test_result_indexing_function(2,1) = isequal(sub2ind([4,3], 2, 1), sub2ind([4,3], 2, 1))
test_result_indexing_function(3,1) = isequal(sub2ind([4,3], 3, 1), sub2ind([4,3], 3, 1))
test_result_indexing_function(4,1) = isequal(sub2ind([4,3], 4, 1), sub2ind([4,3], 4, 1))
test_result_indexing_function(5,1) = isequal(sub2ind([4,3], 1, 2), sub2ind([4,3], 1, 2))
test_result_indexing_function(6,1) = isequal(sub2ind([4,3], 2, 2), sub2ind([4,3], 2, 2))
test_result_indexing_function(7,1) = isequal(sub2ind([4,3], 3, 2), sub2ind([4,3], 3, 2))
test_result_indexing_function(8,1) = isequal(sub2ind([4,3], 4, 2), sub2ind([4,3], 4, 2))
test_result_indexing_function(9,1) = isequal(sub2ind([4,3], 1, 3), sub2ind([4,3], 1, 3))
test_result_indexing_function(10,1) = isequal(sub2ind([4,3], 2, 3), sub2ind([4,3], 2, 3))
test_result_indexing_function(11,1) = isequal(sub2ind([4,3], 3, 3), sub2ind([4,3], 3, 3))
test_result_indexing_function(12,1) = isequal(sub2ind([4,3], 4, 3), sub2ind([4,3], 4, 3))
sub2ind([4,3], 1, 4) % error
sub2ind([4,3], 5, 1) % error
test_result_indexing_function(13,1) = isequal(sub2ind([4,3], 1, 1, 1), sub2ind([4,3], 1, 1, 1))
sub2ind([4,3], 1, 1, 2) % error
%
A = [1,2,3;4,5,6;7,8,9;10,11,12]
A(:,:,2) = A + 12
test_result_indexing_function(14,1) = isequal(size(A), size(A))
test_result_indexing_function(15,1) = isequal(size(A, 1), size(A, 1))
test_result_indexing_function(16,1) = isequal(size(A, 2), size(A, 2))
test_result_indexing_function(17,1) = isequal(size(A, 3), size(A, 3))
test_result_indexing_function(18,1) = isequal(size(A, 4), size(A, 4))
test_result_indexing_function(19,1) = isequal(size(A, [1, 2, 3, 4]), size(A, [1, 2, 3, 4]))
test_result_indexing_function(20,1) = isequal(size(A, [1, 2; 3, 4]), size(A, [1, 2; 3, 4]))
test_result_indexing_function(21,1) = isequal(size(A, 1, 2, 3), size(A, 1, 2, 3))
test_result_indexing_function(22,1) = isequal(size(A, 1, [2, 3, 1], 3), size(A, 1, [2, 3, 1], 3))
test_result_indexing_function(23,1) = isequal(size(A, 1, 2, 3, 4, 5, 6), size(A, 1, 2, 3, 4, 5, 6))
%
A = ones(4,3)
test_result_indexing_function(24,1) = isequal(numel(A), numel(A))
test_result_indexing_function(25,1) = isequal(numel(A,[99,23],2), numel(A,[99,23],2))
test_result_indexing_function(26,1) = isequal(numel(A,[99,23],[4,5,6,7],[90,91,92]), numel(A,[99,23],[4,5,6,7],[90,91,92]))
test_result_indexing_function(27,1) = isequal(numel(1,[99,23],[4,5,6,7],[90,91,92]), numel(1,[99,23],[4,5,6,7],[90,91,92]))
test_result_indexing_function(28,1) = isequal(numel(A,2,":"), numel(A,2,":"))
test_result_indexing_function(29,1) = isequal(numel(A,":",2), numel(A,":",2))


complete_test_result_indexing_function = all(test_result_indexing_function)

complete_test_result_indexing_function
