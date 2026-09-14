-- CJP Version 2.0 - Bulk Product Import Tables Migration Script
-- Creates product_import_jobs, product_import_rows, and product_import_errors

-- 1. Create product_import_jobs Table
CREATE TABLE IF NOT EXISTS product_import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'CSV',
    status VARCHAR(50) DEFAULT 'UPLOADED' CHECK (
        status IN ('UPLOADED', 'VALIDATING', 'VALIDATED', 'IMPORTING', 'COMPLETED', 'PARTIAL_SUCCESS', 'FAILED')
    ),
    total_rows INT DEFAULT 0,
    valid_rows INT DEFAULT 0,
    invalid_rows INT DEFAULT 0,
    processed_rows INT DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    validated_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_mfg ON product_import_jobs(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON product_import_jobs(status);

-- 2. Create product_import_rows Table (Validation Data & Staging Buffer)
CREATE TABLE IF NOT EXISTS product_import_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_job_id UUID NOT NULL REFERENCES product_import_jobs(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    normalized_data JSONB DEFAULT '{}'::jsonb,
    validation_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        validation_status IN ('PENDING', 'VALID', 'INVALID', 'IMPORTED', 'SKIPPED')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(import_job_id, row_number)
);

CREATE INDEX IF NOT EXISTS idx_import_rows_job ON product_import_rows(import_job_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_status ON product_import_rows(import_job_id, validation_status);

-- 3. Create product_import_errors Table
CREATE TABLE IF NOT EXISTS product_import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_job_id UUID NOT NULL REFERENCES product_import_jobs(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    sku VARCHAR(100),
    field VARCHAR(100),
    error_code VARCHAR(100) DEFAULT 'VALIDATION_ERROR',
    error_message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_errors_job ON product_import_errors(import_job_id);
CREATE INDEX IF NOT EXISTS idx_import_errors_row ON product_import_errors(import_job_id, row_number);
