clear
A = cat(3, [ 4,9,4; 0,6,7; 3,4,1; 10,0,6 ], [ 2,7,2; 10,9,3; 6,8,3; 7,2,2 ], [ 2,5,9; 2,0,4; 2,6,6; 5,8,2 ], [ 7,1,10; 7,6,9; 0,5,4; 6,7,6 ], [ 7,2,5; 7,5,4; 8,4,8; 6,4,9 ])
A(:,:,:,2) = A + 10
[M, IM] = cummax(A)
test_result_map_dimension_functions(1,1) = isequal(cummax(A, 1), cummax(A, 1))
test_result_map_dimension_functions(2,1) = isequal(cummax(A, 2), cummax(A, 2))
test_result_map_dimension_functions(3,1) = isequal(cummax(A, 3), cummax(A, 3))
[M, IM] = cummin(A)
test_result_map_dimension_functions(4,1) = isequal(cummin(A, 1), cummin(A, 1))
test_result_map_dimension_functions(5,1) = isequal(cummin(A, 2), cummin(A, 2))
test_result_map_dimension_functions(6,1) = isequal(cummin(A, 3), cummin(A, 3))
test_result_map_dimension_functions(7,1) = isequal(cumsum(A), cumsum(A))
test_result_map_dimension_functions(8,1) = isequal(cumsum(A, 1), cumsum(A, 1))
test_result_map_dimension_functions(9,1) = isequal(cumsum(A, 2), cumsum(A, 2))
test_result_map_dimension_functions(10,1) = isequal(cumsum(A, 3), cumsum(A, 3))
test_result_map_dimension_functions(11,1) = isequal(cumprod(A), cumprod(A))
test_result_map_dimension_functions(12,1) = isequal(cumprod(A, 1), cumprod(A, 1))
test_result_map_dimension_functions(13,1) = isequal(cumprod(A, 2), cumprod(A, 2))
test_result_map_dimension_functions(14,1) = isequal(cumprod(A, 3), cumprod(A, 3))


complete_test_result_map_dimension_functions = all(test_result_map_dimension_functions)

complete_test_result_map_dimension_functions
