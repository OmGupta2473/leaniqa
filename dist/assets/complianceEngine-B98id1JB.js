function u(e){const{targetCalories:t,actualCalories:a,targetProtein:o,actualProtein:c,hasWeightLogged:r}=e,n=t>0?Math.abs(a-t)/t:0,i=(a===0?0:Math.max(0,1-n))*50,s=o>0?Math.min(c/o,1):0,l=c===0?0:s*30,h=r?20:0;return Math.round(i+l+h)}export{u as c};
//# sourceMappingURL=complianceEngine-B98id1JB.js.map
