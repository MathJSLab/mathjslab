% Suffix totals/products are accumulated from the end, without changing x.
x=[2,3,4];
compatible=isequal(cumsum(x,'reverse'),[9,7,4]) && isequal(cumprod(x,'reverse'),[24,12,4]) && isequal(cumsum(x,'forward'),[2,5,9]) && isequal(x,[2,3,4]);
compatible
