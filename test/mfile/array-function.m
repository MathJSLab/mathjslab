clear
% test array functions.
test_result_array_function(1,1) = isequal(zeros(3), zeros(3))
test_result_array_function(2,1) = isequal(zeros(3,7), zeros(3,7))
test_result_array_function(3,1) = isequal(zeros([3,7]), zeros([3,7]))
test_result_array_function(4,1) = isequal(ones(3), ones(3))
test_result_array_function(5,1) = isequal(ones(3,7), ones(3,7))
test_result_array_function(6,1) = isequal(ones([3,7]), ones([3,7]))
test_result_array_function(7,1) = isequal(eye(3), eye(3))
test_result_array_function(8,1) = isequal(eye(3,4), eye(3,4))
test_result_array_function(9,1) = isequal(eye([3,4]), eye([3,4]))
test_result_array_function(10,1) = isequal(rand(3), rand(3))
test_result_array_function(11,1) = isequal(rand(3,4), rand(3,4))
test_result_array_function(12,1) = isequal(rand([3,4]), rand([3,4]))
test_result_array_function(13,1) = isequal(randi(5, 3), randi(5, 3))
test_result_array_function(14,1) = isequal(randi(5, 3,4), randi(5, 3,4))
test_result_array_function(15,1) = isequal(randi(5, [3,4]), randi(5, [3,4]))
A = [1+i, 2+2i, 3+3i; 4+4i, 5+5i, 6+6i; 7+7i, 8+8i, 9+9i]
test_result_array_function(16,1) = isequal(min(A), min(A))
test_result_array_function(17,1) = isequal(max(A), max(A))


complete_test_result_array_function = all(test_result_array_function)

complete_test_result_array_function
