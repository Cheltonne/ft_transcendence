class UserTracker:
    users = set()

    @classmethod
    def add_user(cls, user):
        cls.users.add(user)

    @classmethod
    def remove_user(cls, user):
        cls.users.discard(user)

    @classmethod
    def get_users(cls):
        return cls.users