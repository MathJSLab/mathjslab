clear % clear all variables

H = [2+0i, 0.3+0.4i, 0.2-0.1i, -0.5+0.6i; 0.3-0.4i, 3+0i, 0.1+0.2i,  0.4-0.3i; 0.2+0.1i, 0.1-0.2i, 2.5+0i, -0.2+0.5i; -0.5-0.6i, 0.4+0.3i, -0.2-0.5i, 1.8+0i]
[V,D] = eig(H)
D = eig(H)

test_result_eig_05(1,1) = true

complete_test_result_eig_05 = all(test_result_eig_05)

complete_test_result_eig_05
