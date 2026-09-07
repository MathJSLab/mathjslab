clear
A = [1, 5, 9; 2, 6, 10; 3, 7, 11; 4, 8, 12]
A(:,:,2) = A + 12
test_result_array_shape(1,1) = isequal(reshape(A, 1, 24), reshape(A, 1, 24))
test_result_array_shape(2,1) = isequal(reshape(A, 2, 6, 2), reshape(A, 2, 6, 2))
test_result_array_shape(3,1) = isequal(reshape(A, 3, [], 2), reshape(A, 3, [], 2))
test_result_array_shape(4,1) = isequal(reshape(A, 2, 3, []), reshape(A, 2, 3, []))
reshape(A, 4, 4, []) % error
reshape(A, 2, 5, 2) % error
reshape(A, [], 6, []) % error
A = [1, 5, 9; 2, 6, 10; 3, 7, 11; 4, 8, 12]
A(:,:,1,1) = A + 12
A(:,:,1,2) = A + 24
test_result_array_shape(5,1) = isequal(squeeze(A), squeeze(A))


complete_test_result_array_shape = all(test_result_array_shape)

complete_test_result_array_shape
