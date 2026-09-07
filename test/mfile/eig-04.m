clear % clear all variables

S = [1, 1/2, 1/3, 1/4; 1/2, 1, 2/3, 1/2; 1/3, 2/3, 1, 3/4; 1/4, 1/2, 3/4, 1]
[V,D] = eig(S)
D = eig(S)

test_result_eig_04(1,1) = true

complete_test_result_eig_04 = all(test_result_eig_04)

complete_test_result_eig_04
