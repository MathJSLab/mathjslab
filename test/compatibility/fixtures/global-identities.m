% All empty shapes collapse to scalar identities; so do entirely omitted values.
E=zeros(2,0,3);
N=[NaN,NaN;NaN,NaN];
compatible=sum(E,"all")==0 && prod(E,"all")==1;
compatible=compatible && isequal(size(sum(E,"all")),[1,1]) && isequal(size(prod(E,"all")),[1,1]);
compatible=compatible && sum(N,"all","omitnan")==0 && prod(N,"all","omitnan")==1;
compatible=compatible && isnan(sum(N,"all","includenan"));
compatible=compatible && sum([true,false;true,true],"all")==3 && prod([true,true],"all")==1;
compatible
