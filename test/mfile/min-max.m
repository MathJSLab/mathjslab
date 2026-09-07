clear
[M, IM] = max([ 9,2,8; 9,0,5; 8,5,9; 5,1,5 ])
A = randi(10,[4,3,2])
B = randi(10,[4,1,2])
C = randi(10,[1,3,2])
D = randi(10,[4,3])
test_result_min_max(1,1) = isequal(A, A)
[M, IM] = max(A)
test_result_min_max(2,1) = isequal(max(A, [], 1), max(A, [], 1))
test_result_min_max(3,1) = isequal(max(A, [], 2), max(A, [], 2))
test_result_min_max(4,1) = isequal(max(A, [], 3), max(A, [], 3))
[M, IM] = max(A, [], 3)
test_result_min_max(5,1) = isequal(max(A, B), max(A, B))
test_result_min_max(6,1) = isequal(max(A, C), max(A, C))
test_result_min_max(7,1) = isequal(max(B, C), max(B, C))
test_result_min_max(8,1) = isequal(max(A, D), max(A, D))
test_result_min_max(9,1) = isequal(max([1,-1]), max([1,-1]))
test_result_min_max(10,1) = isequal(max([1,i,-1,-i]), max([1,i,-1,-i]))
test_result_min_max(11,1) = isequal(max(1), max(1))
max(1,2,3) % error


complete_test_result_min_max = all(test_result_min_max)

complete_test_result_min_max
