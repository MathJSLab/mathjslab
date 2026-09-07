clear
% Test multiple assignment
[Z,N]=ind2sub([3,3],5)
X = ind2sub([3,3],5)
[Z,N,M]=ind2sub([3,3],[5,6;7,8])
A = [1,2; 3,4]
[L,U] = lu(A)
A = [10, -7, 0; -3, 2, 6; 5, -1, 5]
[L,U,P] = lu(A)
[B]=1
% discard output
[~]=1
[~,U,P] = lu(A)

test_result_multiple_assignment(1,1) = true

complete_test_result_multiple_assignment = all(test_result_multiple_assignment)

complete_test_result_multiple_assignment
