const express = require('express');
const cors = require('cors');
const knex = require('knex');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = knex({
    client: 'mysql2',
    connection: {
        host: '192.168.3.33',
        port: 30306,
        user: 'user05',
        password: '48730958',
        database: 'db05',
        ssl: { rejectUnauthorized: false }
    }
});

app.get('/', (req, res) => {
    res.send('Hello! Server is running');
});

app.post('/patient', async (req, res) => {
    try {
        const data = req.body.data;
        console.log('get patient', data);
        const sql =
            db
                .select('id', 'hn', 'cid', 'prefix', 'first_name', 'last_name',
                    'gender', 'phone', 'address', 'created_at', 'updated_at',
                    db.raw(`date_format(birth_date, '%Y-%m-%d') as birth_date`),
                    db.raw(`CONCAT(prefix,' ',first_name, ' ', last_name) as full_name`),
                    db.raw(`IF(birth_date IS NOT NULL, DATE_FORMAT(FROM_DAYS(DATEDIFF(CURRENT_DATE,birth_date)),'%y ปี %c เดือน %e วัน'), NULL) as age`)
                )
                .from('patient')
                .orderBy('hn');
        if (data.length) {
            sql.where('hn', data).orWhereRaw(`CONCAT(first_name,' ',last_name) LIKE ?`, [`%${data}%`])
        }
        const result = await sql;
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/save-patient', async (req, res) => {
    try {
        const data = req.body.data;
        console.log('save patient', data);
        if (!data) {
            return res.status(400).json({ error: 'Missing data' });
        }
        const sql = data.id ? db('patient').where('id', data.id).update(data) : db.insert(data).into('patient');
        const result = await sql;
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/delete-patient/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log('del patient', id);
        if (!id) {
            return res.status(400).json({ error: 'Missing patient ID' });
        }
        const result = await db('patient').where('id', id).del();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});