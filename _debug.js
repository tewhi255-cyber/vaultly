let name = '../../etc/passwd';
name = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
console.log('After step 1:', JSON.stringify(name));
name = name.replace(/\.\./g, '_');
console.log('After step 2:', JSON.stringify(name));
