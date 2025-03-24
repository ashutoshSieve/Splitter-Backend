module.exports=function(){
    const today = new Date();
    const option={
        weekday:"long",
        day:"numeric",
        month:"long"
    };
    return today.toLocaleDateString("en-US",option);
};