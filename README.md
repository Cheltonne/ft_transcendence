# ft_transcendence

## Overview

Made with [Philadelphi](https://github.com/philadelphi) and [Ppito16](https://github.com/Ppito16).<br>
**ft_transcendence** is the final project of the common core curriculum at **42 Paris**. It challenges students to build a fully functional, secure, and interactive single page web application for hosting and playing the classic Pong game. The project emphasizes real-time multiplayer features, modular design, and adherence to stringent technical and security constraints.

This project allowed us to deepen our understanding of full-stack web development, real-time communication, database design, and modern security practices. We implemented the following modules and technologies:

---

## Technical Features and Modules

### 1. **Framework and Backend**
- **Backend Framework**: Implemented using **Django**, providing robust support for user management, database integration, and RESTful APIs.
- **Database**: Leveraged **PostgreSQL** for data persistence, ensuring scalable and reliable storage of user and game data.

---

### 2. **Frontend Development**
- **Framework/Toolkit**: Built with **Bootstrap** to create a responsive and visually appealing user interface.
- **Single-Page Application without any JS framework**: Ensures seamless user experience by allowing navigation without full-page reloads.
- **Real-Time Features**: Integrated WebSockets for live updates and interactive components.

---

### 3. **Game Implementation**
- **Pong Gameplay**: Developed an authentic version of Pong with support for:
  - **Human vs. Human**: Live matches between two players.
  - **AI Opponent**: A computer player with balanced gameplay mechanics.
- **Tournament System**: A matchmaking system that organizes players into tournaments, displaying match schedules and results.

---

### 4. **Live Chat**
- **Communication**: Built a live chat system using **WebSockets** for in-game and tournament communication.

---

### 5. **Authentication**
- **Standard User Management**: User registration, login, and authentication implemented with **Django**.
- **OAuth Integration**: Enables secure remote authentication.
- **Security Best Practices**:
  - Enforced HTTPS and WSS (WebSocket Secure).
  - Passwords hashed using a strong algorithm.
  - User inputs validated to prevent SQL Injection and XSS attacks.

---

### 6. **Dashboards**
- **User Statistics**: Displayed individual player performance and achievements.
- **Game Stats**: Provided analytics for tournaments and matches.

---

## Skills Gained

Throughout the project, we developed and strengthened the following skills:

- **Backend Development**: Designing scalable and secure APIs with Django.
- **Frontend Design**: Crafting responsive UIs using Bootstrap and vanilla JavaScript.
- **Real-Time Communication**: Implementing WebSocket protocols for live updates.
- **Database Design**: Structuring relational databases with PostgreSQL.
- **Security Practices**: Applying encryption, input validation, and secure deployment practices.
- **Containerization**: Using **Docker** to containerize the application and manage dependencies.
- **Collaboration and Justification**: Making informed technical decisions and justifying them during evaluations.

---

## Security Considerations

We adhered to best practices to ensure a secure application:
- **Hashed Passwords**: No plaintext passwords stored in the database.
- **HTTPS/WSS**: All communication encrypted for security.
- **Input Validation**: Forms and APIs safeguarded against malicious inputs.
- **Environment Variables**: Secrets stored in a `.env` file, ignored by version control.

---

## Conclusion

**ft_transcendence** represents the culmination of the common core curriculum, blending technical expertise and problem-solving skills. It demonstrates our ability to build a complex, full-stack web application with modern tools and secure practices.

