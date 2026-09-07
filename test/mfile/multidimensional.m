clear
% Test multidimensional arrays
A = [1,2,3;4,5,6;7,8,9;10,11,12]
A(:,:,2,1) = A(:,:,1,1) + 12
A(:,:,1,2) = A(:,:,1,1) + 24
A(:,:,2,2) = A(:,:,1,1) + 36
A(:,:,1,3) = A(:,:,1,1) + 48
A(:,:,2,3) = A(:,:,1,1) + 60
A(:,:,1,4) = A(:,:,1,1) + 72
A(:,:,2,4) = A(:,:,1,1) + 84
A(:,:,1,5) = A(:,:,1,1) + 96
A(:,:,2,5) = A(:,:,1,1) + 108
test_result_multidimensional(1,1) = isequal(A(2,1,2,5), A(2,1,2,5))
test_result_multidimensional(2,1) = isequal(A(110), A(110))
test_result_multidimensional(3,1) = isequal(A([1, 13, 25, 37, 49]), A([1, 13, 25, 37, 49]))
test_result_multidimensional(4,1) = isequal(A(1,1,1), A(1,1,1))
test_result_multidimensional(5,1) = isequal(A(1,1,2), A(1,1,2))
A(1,1,3)
A(1,1,4)
A(1,1,5)
test_result_multidimensional(6,1) = isequal(A([1,2],2,2,[2,3]), A([1,2],2,2,[2,3]))
A(3,2) = 999
A([1,3],2) = 999


complete_test_result_multidimensional = all(test_result_multidimensional)

complete_test_result_multidimensional
