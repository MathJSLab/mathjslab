% Missing measurements keep their positions while the accumulator skips them.
x=[NaN,2,NaN,3,NaN];
compatible=isequal(cumsum(x,"omitnan"),[0,2,2,5,5]) && isequal(cumprod(x,"omitnan"),[1,2,2,6,6]);
compatible=compatible && isequal(cumsum(x,"reverse","omitnan"),[5,5,3,3,0]) && isequal(cumprod(x,"reverse","omitnan"),[6,6,3,3,1]);
compatible=compatible && isequal(isnan(cumsum(x,"includenan")),[true,true,true,true,true]) && isequal(isnan(x),[true,false,true,false,true]);
compatible
