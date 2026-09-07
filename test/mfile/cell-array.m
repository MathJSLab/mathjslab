clear
A = {1,2,3;4,5,6}
test_result_cell_array(1,1) = isequal(A(1), A(1))
test_result_cell_array(2,1) = isequal(A{1}, A{1})
test_result_cell_array(3,1) = isequal(A{:}, A{:})
A = [1,2,3;4,5,6]
A{1}


complete_test_result_cell_array = all(test_result_cell_array)

complete_test_result_cell_array
