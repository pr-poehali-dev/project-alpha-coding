
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  inn VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE requirements (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  title VARCHAR(500) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'other',
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  pdf_url TEXT,
  pdf_filename VARCHAR(500),
  ai_response TEXT,
  user_response TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO companies (name, inn) VALUES
  ('ООО «Пример»', '7701234567'),
  ('ИП Иванов А.А.', '501234567890');
