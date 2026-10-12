% Each page represents a batch; reduce its row and column measurements.
A=reshape([1,NaN,2,3,4,5,NaN,7],[2,2,2]);
totals=sum(A,[1,2],"omitnan");
factors=prod(A,[2;1],"omitnan");
compatible=isequal(size(totals),[1,1,2]) && isequal(reshape(totals,1,2),[6,16]);
compatible=compatible && isequal(reshape(factors,1,2),[6,140]);
compatible=compatible && isequal(isnan(reshape(sum(A,[1,2]),1,2)),[true,true]);
compatible
