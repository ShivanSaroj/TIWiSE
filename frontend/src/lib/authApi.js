import api from "./api";

export const signup =async(username,password,email)=>{
    console.log("Sending request to backend");
    return await api.post("/auth/signup",{
        username,
        password,
        email,
    },
     {
                              withCredentials:true, 
     });
};
export const loginUser =async(username,password)=>{
    return await api.post("/auth/login",{
        username,
        password,
      
    },
    {
        withCredentials:true,
    }
);
};

export const authStatus =async()=>{
    return await api.get("/auth/status",
    {
        withCredentials:true,
    }
);
};

export const logoutUser =async()=>{
    return await api.post("/auth/logout",{},
    {
        withCredentials:true,
    }
);
};

export const setup2FA =async()=>{
    return await api.post("/auth/2fa/setup",{},
    {
        withCredentials:true,
    }
);
};

export const verify2FA =async(token)=>{
    return await api.post("/auth/2fa/verify",
    {token},
    {
        withCredentials:true,
    }
);
};

export const reset2FA =async()=>{
    return await api.post("/auth/2fa/reset",
    {},
    {
        withCredentials:true,
    }
);
};
