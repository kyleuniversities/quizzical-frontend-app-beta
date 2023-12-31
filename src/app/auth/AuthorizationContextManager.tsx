import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { UserCredentials, loginRequest } from './AuthorizationInterface';

/**
 * Constant for context for the user's authorization
 */
export const AuthorizationContext = React.createContext(null);

// Export null username constant
export const NULL_USERNAME = '#signedOut';

// Export null username id
export const NULL_ID = 'null';

// Function for extracting id
const getId = (decodedToken: any): string => {
  try {
    return decodedToken.id;
  } catch (e: any) {
    return NULL_ID;
  }
};

type AuthorizationUser = {
  username: string | undefined;
  userId: string | undefined;
  roles: any;
};

/**
 * Constant for null user
 */
const NULL_USER: AuthorizationUser = {
  username: NULL_USERNAME,
  userId: NULL_ID,
  roles: null,
};

/**
 * Wrapper for Managing User Authorization around components
 */
export const AuthorizationContextManager = (props: {
  children: ReactNode;
}): JSX.Element => {
  // Set up user variable
  const [user, setUser] = useState(NULL_USER);

  // Sets up user from token
  const setUserFromToken = () => {
    const token = localStorage.getItem('access_token');
    if (token && token !== 'undefined') {
      const decodedToken: any = jwtDecode(token);
      setUser({
        username: decodedToken.sub,
        userId: getId(decodedToken),
        roles: null,
      });
    }
  };

  // Login action
  const logIn = async (credentials: UserCredentials): Promise<any> => {
    return new Promise((resolve, reject) => {
      loginRequest(credentials)
        .then((res) => {
          alert('HEADERS: ' + JSON.stringify(res));
          const jwtToken = res.token;
          if (!jwtToken || jwtToken === 'undefined') {
            resolve(res);
            return;
          }
          localStorage.setItem('access_token', jwtToken);
          const decodedToken: any = jwtDecode(jwtToken);
          alert('DECODED: ' + JSON.stringify(decodedToken));
          setUser({
            username: decodedToken.sub,
            userId: getId(decodedToken),
            roles: null,
          });
          resolve(res);
        })
        .catch((err) => reject(err));
    });
  };

  // Logout action
  const logOut = (): void => {
    localStorage.removeItem('access_token');
    setUser(NULL_USER);
  };

  // Checks if authenticated
  const isUserAuthenticated = (): boolean => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return false;
    }
    const expiration = jwtDecode(token).exp;
    if (expiration && Date.now() > expiration * 1000) {
      logOut();
      return false;
    }
    if (!expiration) {
      return false;
    }
    return true;
  };

  // Gets user upon render
  useEffect(() => setUserFromToken(), []);

  // Creates a user context object
  const userContext: any = {
    user,
    logIn,
    logOut,
    isUserAuthenticated,
    setUserFromToken,
  };

  // Returns the components with the session as context
  return (
    <AuthorizationContext.Provider value={userContext}>
      {props.children}
    </AuthorizationContext.Provider>
  );
};

// Export useAuthorization Hook
export const useAuthorization = () => useContext(AuthorizationContext);

// Export useUsername Hook
export const useUsername = () => {
  const userContext: any = useAuthorization();
  return userContext && userContext.user && userContext.user.username
    ? userContext.user.username
    : NULL_USERNAME;
};

// Export useUserId Hook
export const useUserId = () => {
  const userContext: any = useAuthorization();
  return userContext && userContext.user && userContext.user.userId
    ? userContext.user.userId
    : NULL_ID;
};
