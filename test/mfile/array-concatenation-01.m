clear
% Test array concatenation
test_result_array_concatenation_01(1,1) = isequal([[1,2];[3,4]], [[1,2];[3,4]])
A = zeros(3,3)
B = ones(3,3)
C = 2 * ones(3,3)
test_result_array_concatenation_01(2,1) = isequal([A, B], [A, B])
test_result_array_concatenation_01(3,1) = isequal(horzcat(A, B), horzcat(A, B))
test_result_array_concatenation_01(4,1) = isequal(cat(2, A, B), cat(2, A, B))
test_result_array_concatenation_01(5,1) = isequal([A; B], [A; B])
test_result_array_concatenation_01(6,1) = isequal(vertcat(A, B), vertcat(A, B))
test_result_array_concatenation_01(7,1) = isequal(cat(1, A, B), cat(1, A, B))
test_result_array_concatenation_01(8,1) = isequal(cat(3, A, B), cat(3, A, B))
test_result_array_concatenation_01(9,1) = isequal([A, B, C], [A, B, C])
test_result_array_concatenation_01(10,1) = isequal(horzcat(A, B, C), horzcat(A, B, C))
test_result_array_concatenation_01(11,1) = isequal(cat(2, A, B, C), cat(2, A, B, C))
test_result_array_concatenation_01(12,1) = isequal([A; B; C], [A; B; C])
test_result_array_concatenation_01(13,1) = isequal(vertcat(A, B, C), vertcat(A, B, C))
test_result_array_concatenation_01(14,1) = isequal(cat(1, A, B, C), cat(1, A, B, C))
test_result_array_concatenation_01(15,1) = isequal(cat(3, A, B, C), cat(3, A, B, C))
A = [1, 2, 3; 4, 5, 6]
B = [7, 8, 9; 10, 11, 12]
C = [A, B]
D = [A; B]
F = [A; 7:9]
G = [20; 30; 40]
H = [F, G]
K = [A, B; A, B]
L = [K; [A, B; A, B]]
M = L.'
N = L'
O = [1:5]
P = O.'
Q = O'
R = P.'
S = P'
O = [1:4; A] % error
[1, 2; 3, 4; 6, 6, 7] % error
% multidimensional concatenation
test_result_array_concatenation_01(16,1) = isequal(cat(1, zeros(3, 3, 3), ones(3, 3, 3), 2 * ones(3, 3, 3)), cat(1, zeros(3, 3, 3), ones(3, 3, 3), 2 * ones(3, 3, 3)))
test_result_array_concatenation_01(17,1) = isequal(cat(2, zeros(3, 3, 3), ones(3, 3, 3), 2 * ones(3, 3, 3)), cat(2, zeros(3, 3, 3), ones(3, 3, 3), 2 * ones(3, 3, 3)))
test_result_array_concatenation_01(18,1) = isequal(cat(3, zeros(3, 3, 3), ones(3, 3, 3), 2 * ones(3, 3, 3)), cat(3, zeros(3, 3, 3), ones(3, 3, 3), 2 * ones(3, 3, 3)))
test_result_array_concatenation_01(19,1) = isequal(cat(3, zeros(3, 3), ones(3, 3), 2 * ones(3, 3)), cat(3, zeros(3, 3), ones(3, 3), 2 * ones(3, 3)))
cat(2, zeros(3, 3, 3), ones(3, 3, 3), 2 * ones(3, 3)) % error


complete_test_result_array_concatenation_01 = all(test_result_array_concatenation_01)

complete_test_result_array_concatenation_01
