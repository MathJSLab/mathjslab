clear % clear all variables
A = [2+3i]
A = [2+ 3i 4-5i]
B = [1 2; 3 4]
M = [B zeros(2)
     zeros(2) B]

test_result_array_concatenation_02(1,1) = true

complete_test_result_array_concatenation_02 = all(test_result_array_concatenation_02)

complete_test_result_array_concatenation_02
