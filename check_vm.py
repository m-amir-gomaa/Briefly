import pexpect
import sys

child = pexpect.spawn('ssh -o StrictHostKeyChecking=no -p 2223 briefly@localhost "docker ps -a"')
child.expect('assword:')
child.sendline('briefly_secret')
child.expect(pexpect.EOF)
print(child.before.decode('utf-8'))
