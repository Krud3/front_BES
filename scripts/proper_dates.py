import csv
from datetime import datetime, timedelta

# Load the CSV file
input_file = 'graph_data.csv'
output_file = 'graph_data_pd.csv'

def increment_date(base_date, round_value):
    # Increment the date by "round_value" minutes
    return base_date + timedelta(days=round_value)

def main():
    with open(input_file, mode='r') as infile, open(output_file, mode='w', newline='') as outfile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()

        # Start with a base date for the first row
        base_date = datetime(2024, 1, 1, 0, 0, 0)

        for row in reader:
            round_value = int(row['round'])

            # Increment the date based on "round_value"
            new_created_at = increment_date(base_date, round_value)

            # Convert the new date to ISO 8601 format (JavaScript compatible)
            row['created_at'] = new_created_at.isoformat()

            # Write the modified row to the output file
            writer.writerow(row)

if __name__ == "__main__":
    main()
