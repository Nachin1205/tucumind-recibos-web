import bcrypt

password = "admin123".encode('utf-8')
salt = bcrypt.gensalt(rounds=12)
hashed_password = bcrypt.hashpw(password, salt)
print(hashed_password.decode('utf-8'))
