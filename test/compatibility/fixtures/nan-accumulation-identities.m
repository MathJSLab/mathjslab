% Explicit MATLAB contract: all-missing lines use the accumulation identity.
x=[NaN,NaN,NaN];
z=[1+i,complex(2,NaN),complex(NaN,3),2+i];
compatible=isequal(cumsum(x,"omitnan"),[0,0,0]) && isequal(cumprod(x,"reverse","omitnan"),[1,1,1]);
compatible=compatible && isequal(cumsum(z,"omitnan"),[1+i,1+i,1+i,3+2i]);
compatible=compatible && isequal(cumprod(z,"omitnan"),[1+i,1+i,1+i,1+3i]);
compatible
