clear
% Test histogram function.
A = [12, 34, 95, 123, 13, 78, 43, 87, 34, 56, 73, 56]
B = ['jan', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'aug', 'sep', 'out', 'nov', 'dec']
histogram(A, B)

test_result_histogram(1,1) = true

complete_test_result_histogram = all(test_result_histogram)

complete_test_result_histogram
