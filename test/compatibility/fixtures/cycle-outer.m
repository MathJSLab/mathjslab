x+=2;
load("cycle-inner.m");
x=cycle_temporary(x);
function y=cycle_temporary(v)
  pause(0);
  y=2*v;
end
