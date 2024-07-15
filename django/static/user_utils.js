import { getCookie, getUserFromStorage, showToast } from "./utils.js";

export async function addFriend(userId) {
    const response = await fetch(`/accounts/${userId}/add_friend/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'include'
    });
    return response.json();
}

export async function removeFriend(userId) {
    const response = await fetch(`/accounts/${userId}/remove_friend/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'include'
    });
    return response.ok;
}

export async function getFriends() {
    const response = await fetch(`/accounts/my_friends/`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        credentials: 'include'
    });
 
    if (response.ok) {
        return await response.json();
    }
    else {
        console.error('Failed to fetch friends:', response.statusText);
        return [];
    }
}

export async function getUserByUsername(username) {
    const response = await fetch(`/accounts/by-username/${username}/`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + getCookie('token') // Adjust for your auth method
        }
    });

    if (response.ok) {
        const user = await response.json();
        console.log(user);
        if (username === getUserFromStorage().username){
            showToast('Cant\'t add yourself as friend!', 'error');
            return null;
        }
        return user;
    } else {
        console.error('Failed to fetch user by username:', response.statusText);
        showToast('Couldn\'t find user \"' + username + '\", please verify the username.', 'error');
        return null;
    }
}
