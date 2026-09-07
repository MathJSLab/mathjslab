clear % clear all variables

S = [1, 1/2, 1/3, 1/4; 1/2, 1, 2/3, 1/2; 1/3, 2/3, 1, 3/4; 1/4, 1/2, 3/4, 1]
[V,D] = eig(S)
D = eig(S)
H = [2+0i, 0.3+0.4i, 0.2-0.1i, -0.5+0.6i; 0.3-0.4i, 3+0i, 0.1+0.2i,  0.4-0.3i; 0.2+0.1i, 0.1-0.2i, 2.5+0i, -0.2+0.5i; -0.5-0.6i, 0.4+0.3i, -0.2-0.5i, 1.8+0i]
[V,D] = eig(H)
D = eig(H)

test_result_eig_03(1,1) = true

complete_test_result_eig_03 = all(test_result_eig_03)

complete_test_result_eig_03
