% Empty reduced lines use identities; other empty axes retain their shapes.
compatible=sum([])==0 && prod([])==1 && sum([NaN,NaN],"omitnan")==0 && prod([NaN,NaN],"omitnan")==1;
compatible=compatible && isequal(sum(zeros(0,3)),[0,0,0]) && isequal(prod(zeros(0,3)),[1,1,1]);
compatible=compatible && isequal(sum(zeros(2,0),2),[0;0]) && isequal(prod(zeros(2,0),2),[1;1]);
compatible=compatible && isequal(size(sum(zeros(2,0),1)),[1,0]) && isequal(size(prod(zeros(0,3),2)),[0,1]);
compatible
