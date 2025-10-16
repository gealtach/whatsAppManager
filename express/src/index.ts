import app from './app';
import 'dotenv/config';

const PORT = 3001;

app.listen(PORT,'0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});